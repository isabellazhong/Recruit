from gemini.gemini_client import GeminiClient

class JobFormatter:
    def __init__(self, client:GeminiClient, job_description: str):
        self.client = client
        self.job_description = job_description

    def summarize_job_description(self):
        """
        Summarizes job description to use up less tokens. 
        """
        prompt = (
            f"Please summarize this job description to highlight the\n"
            f"key qualifications that the job wants. Here is the job:\n"
            f"${self.job_description}"
        )
        return self.client.getResponse(prompt)