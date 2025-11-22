import pandas as pd
from sentence_transformers import SentenceTransformer, util

class TechnicalQuestionsGenerator: 
    def __init__(self, job_description: str):
        self.job_description = job_description  
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        splits = {'train': 'LeetCodeDataset-train.jsonl', 'test': 'LeetCodeDataset-test.jsonl'}
        self.df = pd.read_json("hf://datasets/newfacade/LeetCodeDataset/" + splits["train"], lines=True)

        self.problem_embeddings = self.model.encode(self.df['query'].tolist(), convert_to_tensor=True)
        self.job_desc_embedding = self.model.encode(job_description, convert_to_tensor=True)

    def find_top_questions(self, k:int):
        hits = util.semantic_search(self.job_desc_embedding, self.problem_embeddings, top_k=k)
        problems = []

        for hit in hits[0]:
            idx = hit['corpus_id']
            problems.append(self.format_problem(self.df.iloc[idx]))
        
        return problems
    
    def format_title(self, task_id: str) -> str:
        words = task_id.replace('-', ' ').split()
        return ' '.join(word.capitalize() for word in words)
    
    def format_problem(self, problem:dict):
        return {
            "title": self.format_title(problem['task_id']),
            "difficulty": problem['difficulty'],
            "problem_description": problem["problem_description"],
            "starter_code": problem["starter_code"],
            "desc": problem["query"],
            "tags": problem["tags"],
            "input_output": problem["input_output"]
        }


if __name__ == '__main__':
    #example 
    job = """
    What you’ll do:
    • Demonstrate accountability and quality in your work while receiving support and guidance from your mentor, manager, and peers
    • Execute scoped technical tasks end-to-end to help build the future of Pinterest
    • Deliver code that is well-documented, tested, and operable
    • Communicate new ideas and opinions with candor as you grow both professionally and personally through learning and development opportunities
    • Collaborate with your team and contribute to real projects that impact Pinterest
    • Opportunities to interact with leaders and employees across Pinterest and to participate in a variety of optional company events

    What we’re looking for:
    • This position requires current enrollment in a school or education program in which the individual is working towards a Bachelor’s in Computer Science or related technical field
    • Obtain Bachelor's in Computer Science or related technical field by June 2028
    • 2-3 years of CS classes under your belt (Intro to CS and Algorithms, Advanced Algorithms, Operating Systems and Data Structures are all great!)
    • Ability to demonstrate an understanding of computer science fundamentals, including data structures and algorithms.
    • Aptitude for JavaScript, CSS, C++, HTML, Python, Java, Go–we use a variety of programming languages and tools
    • Non-academic coding experience (i.e. hack-a-thons, code challenges, personal projects, GitHub, Open Source, volunteer coding experience, conference participation, etc.)
    • A curious nature with a desire to tackle and solve complex problem
    """
    t = TechnicalQuestionsGenerator(job)
    print(t.find_top_questions(3))