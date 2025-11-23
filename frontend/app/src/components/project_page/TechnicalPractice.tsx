import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCopy,
  Code,
  Loader2,
  Play,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import '../../pages/project_page/ProjectPage.css';
import { fetchTechnicalQuestions } from '../../api/projects';
import type { TechnicalQuestion } from '../../api/projects';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface TestCase {
  id: string;
  args: unknown[];
  expected: unknown;
}

interface Sample {
  input: string;
  output: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty | string;
  tags: string[];
  starterCode: string;
  samples: Sample[];
  tests: TestCase[];
  exportName?: string;
  language?: string;
  metadata?: {
    prompt?: string;
  };
}

interface TechnicalPracticeProps {
  jobDescription: string;
}

interface TestRunResult extends TestCase {
  pass: boolean;
  output: unknown;
  error?: string;
}

const TOP_K = 3;

const normalizeBackendQuestion = (raw: TechnicalQuestion, index: number): Question => {
  const samples = Array.isArray(raw.input_output)
    ? raw.input_output.map((sample) => ({
        input: sample?.input ?? '',
        output: sample?.output ?? '',
      }))
    : [];

  return {
    id: raw.id ?? `remote-question-${index}`,
    title: raw.title ?? `Question ${index + 1}`,
    description: raw.problem_description ?? raw.desc ?? 'No description provided.',
    difficulty: (raw.difficulty ?? 'Medium') as Difficulty | string,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    starterCode: raw.starter_code ?? '',
    samples,
    tests: [],
    language: raw.language ?? 'python',
    metadata: {
      prompt: raw.desc,
    },
  };
};

const getDifficultyClass = (difficulty: Question['difficulty']) =>
  (difficulty || 'medium').toString().toLowerCase();

const formatValue = (value: unknown) => {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const deepEqual = (a: unknown, b: unknown) => {
  if (Object.is(a, b)) {
    return true;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    return false;
  }
};

export default function TechnicalPractice({ jobDescription }: TechnicalPracticeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestRunResult[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const questionsCacheRef = useRef<Map<string, Question[]>>(new Map());

  const selectedQuestion = useMemo(() => {
    if (!questions.length) {
      return undefined;
    }
    if (!selectedQuestionId) {
      return questions[0];
    }
    return questions.find((question) => question.id === selectedQuestionId) ?? questions[0];
  }, [questions, selectedQuestionId]);

  useEffect(() => {
    const trimmed = jobDescription?.trim();
    if (!trimmed) {
      setQuestions([]);
      setSelectedQuestionId(null);
      setFetchError(null);
      setIsLoadingQuestions(false);
      return;
    }

    const cachedQuestions = questionsCacheRef.current.get(trimmed);
    if (cachedQuestions) {
      setQuestions(cachedQuestions);
      setSelectedQuestionId(cachedQuestions[0]?.id ?? null);
      setFetchError(null);
      setIsLoadingQuestions(false);
      return;
    }

    const controller = new AbortController();
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      setFetchError(null);
      try {
        const payload = await fetchTechnicalQuestions(trimmed, TOP_K, controller.signal);
        const remoteQuestions = Array.isArray(payload)
          ? payload.map((question: TechnicalQuestion, index: number) =>
              normalizeBackendQuestion(question, index),
            )
          : [];

        if (!remoteQuestions.length) {
          setQuestions([]);
          setSelectedQuestionId(null);
          setFetchError('No matching technical questions were found for that job description.');
          return;
        }

        setQuestions(remoteQuestions);
        setSelectedQuestionId(remoteQuestions[0].id);
        questionsCacheRef.current.set(trimmed, remoteQuestions);
      } catch (error) {
        if (!controller.signal.aborted) {
          setQuestions([]);
          setSelectedQuestionId(null);
          setFetchError((error as Error).message ?? 'Unable to fetch technical questions.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingQuestions(false);
        }
      }
    };

    loadQuestions();
    return () => controller.abort();
  }, [jobDescription]);

  useEffect(() => {
    setCode(selectedQuestion?.starterCode ?? '');
    setTestResults([]);
    setStatus(null);
  }, [selectedQuestion]);

  const jobSnippet = useMemo(() => {
    if (!jobDescription) {
      return '';
    }
    const normalized = jobDescription.replace(/\s+/g, ' ').trim();
    return normalized.length > 140 ? `${normalized.slice(0, 140)}…` : normalized;
  }, [jobDescription]);

  const testsAvailable = Boolean(
    selectedQuestion && selectedQuestion.tests.length > 0 && selectedQuestion.exportName,
  );

  const runTests = () => {
    if (!selectedQuestion) {
      setStatus({ type: 'error', message: 'Load a question before running tests.' });
      setTestResults([]);
      return;
    }

    if (!code.trim()) {
      setStatus({ type: 'error', message: 'Write your solution before running tests.' });
      setTestResults([]);
      return;
    }

    if (!testsAvailable) {
      setStatus({ type: 'error', message: 'Automated tests are unavailable for this question.' });
      setTestResults([]);
      return;
    }

    setIsRunning(true);
    setTimeout(() => {
      try {
        const harness = new Function(`${code}\nreturn ${selectedQuestion.exportName};`);
        const userFunction = harness();

        if (typeof userFunction !== 'function') {
          throw new Error(`Could not find a function named ${selectedQuestion.exportName}.`);
        }

        const outcomes = selectedQuestion.tests.map<TestRunResult>((test) => {
          try {
            const output = userFunction(...test.args);
            const pass = deepEqual(output, test.expected);
            return { ...test, pass, output };
          } catch (error) {
            return { ...test, pass: false, output: undefined, error: (error as Error).message };
          }
        });

        setTestResults(outcomes);
        const passed = outcomes.filter((result) => result.pass).length;
        const total = outcomes.length;
        setStatus({
          type: passed === total ? 'success' : 'error',
          message: `Passed ${passed}/${total} tests`,
        });
      } catch (error) {
        setTestResults([]);
        setStatus({ type: 'error', message: (error as Error).message });
      } finally {
        setIsRunning(false);
      }
    }, 200);
  };

  const resetCode = () => {
    if (!selectedQuestion) {
      setCode('');
      setTestResults([]);
      setStatus(null);
      return;
    }
    setCode(selectedQuestion.starterCode);
    setTestResults([]);
    setStatus(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      setStatus({ type: 'error', message: 'Unable to copy code. Please try again.' });
    }
  };

  const consoleHint = testResults.length
    ? 'Review each test evaluation.'
    : testsAvailable
      ? 'Run the tests to see feedback here.'
      : selectedQuestion
        ? 'Automated tests are unavailable for this question. Use the examples to self-check your solution.'
        : 'Paste a job description to fetch tailored technical questions.';

  return (
    <div className="ih-tech-grid">
      <section className="ih-card ih-card-column ih-tech-panel">
        <header className="ih-card-header ih-tech-header">
          {selectedQuestion ? (
            <>
              <div>
                <h3>{selectedQuestion.title}</h3>
                <p>{selectedQuestion.description}</p>
                {selectedQuestion.metadata?.prompt && (
                  <p className="ih-question-tags">{selectedQuestion.metadata.prompt}</p>
                )}
              </div>
              <div className="ih-tech-header-pill">
                <div
                  className={`ih-difficulty ih-difficulty-${getDifficultyClass(selectedQuestion.difficulty)}`}
                >
                  {selectedQuestion.difficulty}
                </div>
                {selectedQuestion.language && (
                  <span className="ih-language-pill">{selectedQuestion.language.toUpperCase()}</span>
                )}
              </div>
            </>
          ) : (
            <div>
              <h3>Paste a job description to begin</h3>
              <p>
                Your technical prompts come directly from the backend and require a job description for context.
                Provide one to fetch tailored questions.
              </p>
            </div>
          )}
        </header>

        {jobSnippet && (
          <div className="ih-job-hint">
            <span>Job context highlight</span>
            <p>{jobSnippet}</p>
          </div>
        )}

        {fetchError && (
          <div className="ih-status-banner error">
            <XCircle size={18} />
            <span>{fetchError}</span>
          </div>
        )}

        <div className="ih-question-list">
          {isLoadingQuestions ? (
            <div className="ih-console-empty">
              <Loader2 size={20} className="ih-spin" />
              <p>Loading personalized technical problems…</p>
            </div>
          ) : questions.length ? (
            questions.map((question) => (
              <button
                key={question.id}
                className={`ih-question-card ${question.id === selectedQuestion?.id ? 'active' : ''}`}
                onClick={() => setSelectedQuestionId(question.id)}
              >
                <div>
                  <p className="ih-question-title">{question.title}</p>
                  <p className="ih-question-tags">{question.tags.join(' · ')}</p>
                </div>
                <span className={`ih-difficulty-mini ih-difficulty-${getDifficultyClass(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              </button>
            ))
          ) : (
            <div className="ih-console-empty">
              <Code size={20} />
              <p>No questions yet. Paste a job description to generate relevant problems.</p>
            </div>
          )}
        </div>

        <div className="ih-question-details">
          <div className="ih-question-meta">
            <Code size={16} />
          </div>
          <div className="ih-samples">
            {selectedQuestion && selectedQuestion.samples.length ? (
              selectedQuestion.samples.map((sample, index) => (
                <div key={`${selectedQuestion.id}-sample-${index}`} className="ih-sample-card">
                  <p className="ih-sample-label">Example {index + 1}</p>
                  <p>
                    <strong>Input:</strong> {sample.input}
                  </p>
                  <p>
                    <strong>Output:</strong> {sample.output}
                  </p>
                </div>
              ))
            ) : (
              <div className="ih-console-empty">
                <Code size={20} />
                <p>{selectedQuestion ? 'No sample data available for this prompt.' : 'Examples will appear once a question loads.'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="ih-card ih-card-column ih-tech-editor">
        <header className="ih-editor-header">
          <div>
            <h3>Code Workspace</h3>
            {selectedQuestion?.language && (
              <p className="ih-question-tags">Suggested language: {selectedQuestion.language}</p>
            )}
          </div>
          <div className="ih-editor-actions">
            <button className="ih-outline-btn" onClick={resetCode}>
              <RefreshCcw size={16} />
              <span>Reset</span>
            </button>
            <button className="ih-outline-btn" onClick={copyCode}>
              <ClipboardCopy size={16} />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              className="ih-primary-btn"
              onClick={runTests}
              disabled={isRunning || !testsAvailable}
              title={
                !selectedQuestion
                  ? 'Load a question to enable tests'
                  : testsAvailable
                    ? ''
                    : 'Automated tests are not available for this prompt'
              }
            >
              {isRunning ? <Loader2 size={18} className="ih-spin" /> : <Play size={18} />}
              <span>{isRunning ? 'Running…' : testsAvailable ? 'Run Tests' : 'Tests Unavailable'}</span>
            </button>
          </div>
        </header>

        <textarea
          className="ih-code-editor"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={selectedQuestion ? 'Write your solution here…' : 'Waiting for a question to load.'}
          disabled={!selectedQuestion}
        />

        {status && (
          <div className={`ih-status-banner ${status.type}`}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="ih-console">
          <div className="ih-console-header">
            <h4>Test Console</h4>
            <p>{consoleHint}</p>
          </div>
          {testResults.length ? (
            <ul className="ih-test-results">
              {testResults.map((result) => (
                <li key={result.id} className={`ih-test-row ${result.pass ? 'pass' : 'fail'}`}>
                  <div className="ih-test-row-header">
                    {result.pass ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div className="ih-test-row-body">
                    <p>
                      <strong>Expected:</strong> {formatValue(result.expected)}
                    </p>
                    <p>
                      <strong>Received:</strong> {formatValue(result.output)}
                    </p>
                    {result.error && (
                      <p className="ih-test-error">
                        <strong>Error:</strong> {result.error}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ih-console-empty">
              <Code size={20} />
              <p>No test output yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
