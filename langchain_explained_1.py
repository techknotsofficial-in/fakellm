"""
╔══════════════════════════════════════════════════════════════════╗
║         LangChain Explained Through Code — Not Just Theory       ║
║                                                                  ║
║  This file walks you through LangChain's core functionalities    ║
║  using simulated/real examples so you can SEE what it does.      ║
╚══════════════════════════════════════════════════════════════════╝

LangChain is a framework for building applications powered by LLMs (Large Language Models).
Instead of just reading about it — this file SHOWS each concept with runnable code.

STRUCTURE:
  1.  What is LangChain?
  2.  LLMs & Chat Models
  3.  Prompt Templates
  4.  Chains (LCEL - LangChain Expression Language)
  5.  Output Parsers
  6.  Memory
  7.  Retrieval Augmented Generation (RAG)
  8.  Agents & Tools
  9.  Callbacks
  10. A Full Mini-App combining everything

SETUP:
  pip install langchain langchain-community langchain-core openai faiss-cpu tiktoken

NOTE: Replace YOUR_API_KEY with your actual OpenAI key to run live.
      Most sections include a SIMULATED version so you can run without a key.
"""

import json
import time
from datetime import datetime

# ─────────────────────────────────────────────────────────────────
# SECTION 1: What is LangChain?
# ─────────────────────────────────────────────────────────────────

def section_1_what_is_langchain():
    """
    LangChain = a framework to BUILD things with LLMs.

    Core building blocks:
      ┌─────────────────────────────────────────────────────────┐
      │  Model I/O    →  Talk to LLMs / Chat models             │
      │  Prompts      →  Template and format inputs             │
      │  Chains       →  Compose multiple steps together        │
      │  Memory       →  Remember past conversations            │
      │  Retrieval    →  Search your own documents (RAG)        │
      │  Agents       →  LLM decides what tools to use          │
      │  Callbacks    →  Hook into events (logging, streaming)  │
      └─────────────────────────────────────────────────────────┘
    """
    print("=" * 60)
    print("SECTION 1: What is LangChain?")
    print("=" * 60)
    print(__doc__.split("STRUCTURE:")[0].strip())
    print("\nLangChain lets you build:")
    apps = [
        "🤖 Chatbots with memory",
        "📄 Document Q&A systems (RAG)",
        "🔧 AI Agents that use tools (search, calculator, etc.)",
        "⛓️  Pipelines: input → process → output",
        "🧠 Apps that reason step-by-step",
    ]
    for app in apps:
        print(f"  {app}")


# ─────────────────────────────────────────────────────────────────
# SECTION 2: LLMs & Chat Models
# ─────────────────────────────────────────────────────────────────

def section_2_llms_and_chat_models(use_real_api=False, api_key=None):
    """
    LangChain wraps different LLMs under one interface.
    You can swap providers (OpenAI, Anthropic, Hugging Face) easily.
    """
    print("\n" + "=" * 60)
    print("SECTION 2: LLMs & Chat Models")
    print("=" * 60)

    print("""
CONCEPT:
  LangChain has two model types:
    • LLM        → takes a raw string, returns a string
    • ChatModel  → takes a list of messages, returns a message

  Both share a common interface, so swapping providers is easy.
""")

    # --- SIMULATED version (no API key needed) ---
    class FakeLLM:
        """Simulates what langchain's LLM.invoke() does."""
        def invoke(self, prompt: str) -> str:
            return f"[Simulated LLM response to: '{prompt[:40]}...']"

    class FakeChatModel:
        """Simulates what langchain's ChatOpenAI.invoke() does."""
        def invoke(self, messages: list) -> dict:
            last = messages[-1]["content"]
            return {"role": "assistant", "content": f"[Chat reply to: '{last[:40]}']"}

    # ── Real LangChain Code (commented out — uncomment with a real key) ──
    real_code = '''
    # REAL CODE — uncomment to use:
    from langchain_openai import OpenAI, ChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage

    # LLM (text completion style)
    llm = OpenAI(api_key="YOUR_KEY")
    response = llm.invoke("What is photosynthesis in one sentence?")
    print(response)

    # Chat Model (conversation style)
    chat = ChatOpenAI(model="gpt-4o-mini", api_key="YOUR_KEY")
    messages = [
        SystemMessage(content="You are a helpful science teacher."),
        HumanMessage(content="Explain gravity simply."),
    ]
    reply = chat.invoke(messages)
    print(reply.content)
    '''
    print("CODE EXAMPLE:")
    print(real_code)

    # Run simulated version
    print("SIMULATED OUTPUT:")
    llm = FakeLLM()
    print("  LLM:", llm.invoke("What is photosynthesis in one sentence?"))

    chat = FakeChatModel()
    messages = [
        {"role": "system", "content": "You are a helpful science teacher."},
        {"role": "user", "content": "Explain gravity simply."},
    ]
    print("  Chat:", chat.invoke(messages)["content"])


# ─────────────────────────────────────────────────────────────────
# SECTION 3: Prompt Templates
# ─────────────────────────────────────────────────────────────────

def section_3_prompt_templates():
    """
    PromptTemplates let you write reusable, parameterized prompts.
    Stop hardcoding prompts — use templates!
    """
    print("\n" + "=" * 60)
    print("SECTION 3: Prompt Templates")
    print("=" * 60)

    print("""
CONCEPT:
  Instead of:  f"Explain {topic} to a {level} student"
  You define:  PromptTemplate(input_variables=["topic","level"], template=...)
  Then call:   template.format(topic="AI", level="beginner")

  Benefits:
    ✓ Reusable across your codebase
    ✓ Composable (plug into chains)
    ✓ Supports chat message formatting too
""")

    # ── Simulated PromptTemplate ──
    class PromptTemplate:
        def __init__(self, input_variables, template):
            self.input_variables = input_variables
            self.template = template

        def format(self, **kwargs):
            result = self.template
            for k, v in kwargs.items():
                result = result.replace(f"{{{k}}}", v)
            return result

        def __or__(self, other):
            """Simulates the LCEL pipe: template | llm"""
            return ChainSimulator(self, other)

    class ChainSimulator:
        def __init__(self, prompt, llm):
            self.prompt = prompt
            self.llm = llm

        def invoke(self, inputs):
            formatted = self.prompt.format(**inputs)
            return f"[LLM processed: '{formatted[:60]}...']"

    # Build a prompt template
    explain_template = PromptTemplate(
        input_variables=["topic", "level"],
        template="Explain {topic} to a {level} student in 3 bullet points."
    )

    # Format it with different inputs
    print("FORMATTED PROMPTS:")
    print("  →", explain_template.format(topic="Machine Learning", level="beginner"))
    print("  →", explain_template.format(topic="Quantum Physics", level="PhD"))

    # Real LangChain code
    print("""
REAL LANGCHAIN CODE:
    from langchain_core.prompts import PromptTemplate, ChatPromptTemplate

    # Simple string template
    template = PromptTemplate(
        input_variables=["topic", "level"],
        template="Explain {topic} to a {level} student in 3 bullet points."
    )
    prompt = template.format(topic="AI", level="beginner")

    # Chat prompt template (for ChatModels)
    chat_template = ChatPromptTemplate.from_messages([
        ("system", "You are an expert in {domain}."),
        ("human", "Answer this: {question}"),
    ])
    messages = chat_template.format_messages(
        domain="astrophysics",
        question="What is a black hole?"
    )
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 4: Chains (LCEL)
# ─────────────────────────────────────────────────────────────────

def section_4_chains_lcel():
    """
    Chains connect components together using the pipe operator |
    This is LangChain Expression Language (LCEL).
    """
    print("\n" + "=" * 60)
    print("SECTION 4: Chains (LCEL - LangChain Expression Language)")
    print("=" * 60)

    print("""
CONCEPT:
  Chain = Prompt | LLM | OutputParser

  Each component has .invoke(input) → output passed to next step.
  The pipe | operator connects them like Unix pipes.

  Example flow:
    Input dict → PromptTemplate → formatted string
               → ChatModel       → AIMessage
               → StrOutputParser → plain string
""")

    # Simulate a chain
    class SimChain:
        def __init__(self, steps):
            self.steps = steps

        def invoke(self, input_data):
            result = input_data
            print(f"\n  Chain execution trace:")
            for i, step in enumerate(self.steps):
                result = step(result)
                print(f"    Step {i+1} [{step.__name__}]: {str(result)[:60]}")
            return result

    def prompt_step(inputs):
        return f"Tell me a joke about {inputs['topic']} in {inputs['style']} style."

    def llm_step(prompt_str):
        # Simulated LLM response
        return {"content": f"Why did the {prompt_str.split('about')[1].split('in')[0].strip()} cross the road? To get to the other side! (in {prompt_str.split('in')[1].split('style')[0].strip()} style)"}

    def parser_step(ai_message):
        return ai_message["content"]

    # Label the steps for trace output
    prompt_step.__name__ = "PromptTemplate"
    llm_step.__name__ = "ChatLLM"
    parser_step.__name__ = "StrOutputParser"

    chain = SimChain([prompt_step, llm_step, parser_step])
    result = chain.invoke({"topic": "Python", "style": "dad joke"})
    print(f"\n  Final output: {result}")

    print("""
REAL LANGCHAIN CODE (LCEL):
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    from langchain_core.output_parsers import StrOutputParser

    prompt = ChatPromptTemplate.from_template(
        "Tell me a {style} joke about {topic}."
    )
    llm = ChatOpenAI(model="gpt-4o-mini")
    parser = StrOutputParser()

    # Chain with | operator
    chain = prompt | llm | parser

    result = chain.invoke({"topic": "Python", "style": "dad joke"})
    print(result)

    # You can also batch:
    results = chain.batch([
        {"topic": "cats", "style": "dad"},
        {"topic": "coding", "style": "dry"},
    ])

    # Or stream:
    for chunk in chain.stream({"topic": "AI", "style": "nerdy"}):
        print(chunk, end="", flush=True)
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 5: Output Parsers
# ─────────────────────────────────────────────────────────────────

def section_5_output_parsers():
    """
    Output parsers transform raw LLM text into structured Python objects.
    """
    print("\n" + "=" * 60)
    print("SECTION 5: Output Parsers")
    print("=" * 60)

    print("""
CONCEPT:
  LLMs return raw text. Output parsers convert that to:
    • str         → StrOutputParser (just cleans up text)
    • list        → CommaSeparatedListOutputParser
    • dict/JSON   → JsonOutputParser
    • Pydantic    → PydanticOutputParser (type-safe!)

  This makes LLM output usable in your app's logic.
""")

    # Simulate parsers
    class StrOutputParser:
        def parse(self, text): return text.strip()

    class CommaSeparatedListOutputParser:
        def parse(self, text): return [x.strip() for x in text.split(",")]

    class JsonOutputParser:
        def parse(self, text):
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"error": "Could not parse", "raw": text}

    # Demo
    raw_text = "  Paris, London, Tokyo, New York  "
    raw_json = '{"name": "Alice", "age": 30, "skills": ["Python", "ML"]}'

    str_parser = StrOutputParser()
    list_parser = CommaSeparatedListOutputParser()
    json_parser = JsonOutputParser()

    print("SIMULATED PARSER OUTPUTS:")
    print(f"  StrParser:     '{str_parser.parse(raw_text)}'")
    print(f"  ListParser:    {list_parser.parse(raw_text)}")
    print(f"  JsonParser:    {json_parser.parse(raw_json)}")

    print("""
REAL LANGCHAIN CODE:
    from langchain_core.output_parsers import (
        StrOutputParser,
        CommaSeparatedListOutputParser,
        JsonOutputParser,
    )
    from langchain_core.pydantic_v1 import BaseModel, Field

    # Pydantic parser (type-safe structured output)
    class Person(BaseModel):
        name: str = Field(description="person's name")
        age: int = Field(description="person's age")
        skills: list[str] = Field(description="list of skills")

    parser = JsonOutputParser(pydantic_object=Person)
    # Use parser.get_format_instructions() to tell LLM how to respond
    print(parser.get_format_instructions())
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 6: Memory
# ─────────────────────────────────────────────────────────────────

def section_6_memory():
    """
    Memory gives LangChain chains the ability to remember past messages.
    Without memory, every call is stateless (LLM forgets everything).
    """
    print("\n" + "=" * 60)
    print("SECTION 6: Memory")
    print("=" * 60)

    print("""
CONCEPT:
  LLMs are stateless by default.
  Memory components store and inject history into each new prompt.

  Types of memory:
    • ConversationBufferMemory     → stores all messages
    • ConversationSummaryMemory    → LLM summarizes history
    • ConversationWindowMemory     → keeps last N messages
    • VectorStoreMemory            → retrieves relevant past messages
""")

    # Simulate conversation memory
    class ConversationBufferMemory:
        def __init__(self):
            self.history = []

        def add_message(self, role, content):
            self.history.append({"role": role, "content": content})

        def get_history(self):
            return self.history.copy()

        def format_history(self):
            lines = []
            for msg in self.history:
                prefix = "Human" if msg["role"] == "user" else "AI"
                lines.append(f"{prefix}: {msg['content']}")
            return "\n".join(lines)

    class ConversationWindowMemory(ConversationBufferMemory):
        def __init__(self, k=3):
            super().__init__()
            self.k = k

        def get_history(self):
            return self.history[-(self.k * 2):]  # last k pairs

    # Simulate a conversation
    memory = ConversationBufferMemory()

    conversation = [
        ("user", "Hi! My name is Priya."),
        ("assistant", "Hi Priya! How can I help you today?"),
        ("user", "I'm learning about neural networks."),
        ("assistant", "That's great! Neural networks are fascinating."),
        ("user", "What's my name again?"),
    ]

    print("SIMULATED CONVERSATION WITH MEMORY:")
    for role, content in conversation:
        memory.add_message(role, content)
        prefix = "👤" if role == "user" else "🤖"
        print(f"  {prefix} {content}")

    print("\n  Memory contents (what gets injected into next prompt):")
    print("  " + memory.format_history().replace("\n", "\n  "))

    print("""
REAL LANGCHAIN CODE:
    from langchain.memory import ConversationBufferMemory
    from langchain_openai import ChatOpenAI
    from langchain.chains import ConversationChain

    llm = ChatOpenAI(model="gpt-4o-mini")
    memory = ConversationBufferMemory()

    conversation = ConversationChain(llm=llm, memory=memory, verbose=True)

    # These calls REMEMBER each other
    r1 = conversation.predict(input="Hi! My name is Priya.")
    r2 = conversation.predict(input="What's my name?")   # → "Priya!"
    print(r2)
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 7: Retrieval Augmented Generation (RAG)
# ─────────────────────────────────────────────────────────────────

def section_7_rag():
    """
    RAG = give the LLM access to YOUR documents at query time.
    The LLM doesn't know about your internal docs — RAG fixes that.
    """
    print("\n" + "=" * 60)
    print("SECTION 7: Retrieval Augmented Generation (RAG)")
    print("=" * 60)

    print("""
CONCEPT (RAG Pipeline):

  Your Docs → Split into chunks → Embed (vectorize) → VectorStore
                                                            ↓
  User Question → Embed question → Similarity Search → Top K chunks
                                                            ↓
                               Chunks + Question → LLM → Answer

  This lets an LLM answer questions about YOUR data without fine-tuning!
""")

    # Simulate the RAG pipeline
    import math

    # Fake "documents"
    documents = [
        {"id": 1, "text": "LangChain is a framework for building LLM-powered apps."},
        {"id": 2, "text": "LangChain supports OpenAI, Anthropic, and many other LLM providers."},
        {"id": 3, "text": "Vector databases store embeddings for semantic search."},
        {"id": 4, "text": "RAG combines retrieval with generation for factual answers."},
        {"id": 5, "text": "Agents in LangChain use tools to complete multi-step tasks."},
    ]

    def fake_embed(text: str) -> list:
        """Simulate an embedding as word-count-based vector (NOT real embeddings)."""
        words = set(text.lower().split())
        # Create a simple bag-of-words style vector
        vocab = ["langchain", "llm", "agent", "retrieval", "tool", "vector", "rag", "framework"]
        return [1.0 if w in words else 0.0 for w in vocab]

    def cosine_similarity(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x ** 2 for x in a))
        mag_b = math.sqrt(sum(x ** 2 for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    def retrieve(query: str, docs: list, top_k=2) -> list:
        query_vec = fake_embed(query)
        scored = [(cosine_similarity(query_vec, fake_embed(d["text"])), d) for d in docs]
        scored.sort(reverse=True, key=lambda x: x[0])
        return [d for _, d in scored[:top_k]]

    def fake_llm_with_context(question: str, context_docs: list) -> str:
        context = " | ".join(d["text"] for d in context_docs)
        return f"[Based on: '{context[:80]}...'] → Answer to '{question}'"

    # Run RAG pipeline
    query = "What is RAG and how does it work?"
    print(f"USER QUERY: '{query}'")

    retrieved = retrieve(query, documents, top_k=2)
    print("\nRETRIEVED CHUNKS:")
    for doc in retrieved:
        print(f"  [{doc['id']}] {doc['text']}")

    answer = fake_llm_with_context(query, retrieved)
    print(f"\nLLM ANSWER: {answer}")

    print("""
REAL LANGCHAIN CODE:
    from langchain_community.document_loaders import PyPDFLoader, TextLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
    from langchain_community.vectorstores import FAISS
    from langchain.chains import RetrievalQA

    # 1. Load documents
    loader = TextLoader("my_document.txt")
    docs = loader.load()

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    # 3. Embed and store
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(chunks, embeddings)

    # 4. Create retrieval chain
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    llm = ChatOpenAI(model="gpt-4o-mini")

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

    # 5. Ask questions!
    answer = qa_chain.invoke("What does this document say about X?")
    print(answer["result"])
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 8: Agents & Tools
# ─────────────────────────────────────────────────────────────────

def section_8_agents_and_tools():
    """
    Agents let the LLM DECIDE which tools to use to solve a problem.
    Tools can be: web search, calculator, database, APIs, etc.
    """
    print("\n" + "=" * 60)
    print("SECTION 8: Agents & Tools")
    print("=" * 60)

    print("""
CONCEPT:
  Regular Chain: fixed steps A → B → C (you decide the flow)
  Agent:         LLM decides: "I need to search → calculate → respond"

  Agent Loop (ReAct pattern):
    Thought  → What should I do next?
    Action   → Call tool: search("current BTC price")
    Observation → Tool returns result
    ... (repeat until answer is found)
    Final Answer → Return to user

  Built-in tools: DuckDuckGoSearch, Calculator, Wikipedia,
                  Python REPL, SQL DB, requests, and more.
""")

    # Simulate an agent
    class Tool:
        def __init__(self, name, description, func):
            self.name = name
            self.description = description
            self.func = func

    def calculator(expression: str) -> str:
        try:
            result = eval(expression)
            return str(result)
        except Exception as e:
            return f"Error: {e}"

    def fake_search(query: str) -> str:
        db = {
            "langchain": "LangChain is an LLM framework with 90k+ GitHub stars.",
            "python": "Python is a popular programming language created in 1991.",
            "default": f"Search result for '{query}': [simulated web result]",
        }
        for k, v in db.items():
            if k in query.lower():
                return v
        return db["default"]

    tools = [
        Tool("calculator", "Evaluate math expressions", calculator),
        Tool("search", "Search the web for info", fake_search),
    ]

    def fake_agent(question: str, tools: list) -> str:
        """Simulates how a ReAct agent thinks and acts."""
        steps = []

        # Simulate agent reasoning
        if any(op in question for op in ["+", "-", "*", "/", "calculate", "what is"]):
            # Detect math
            import re
            nums = re.findall(r"[\d\+\-\*\/\.\(\) ]+", question)
            expr = max(nums, key=len).strip() if nums else "0"
            thought = f"This is a math question. I'll use the calculator."
            action_result = calculator(expr)
            steps.append(("Thought", thought))
            steps.append(("Action", f"calculator('{expr}')"))
            steps.append(("Observation", action_result))
            steps.append(("Final Answer", f"The result is {action_result}"))
        else:
            # Default to search
            thought = "I need to look this up."
            search_result = fake_search(question)
            steps.append(("Thought", thought))
            steps.append(("Action", f"search('{question[:30]}...')"))
            steps.append(("Observation", search_result))
            steps.append(("Final Answer", search_result))

        return steps

    print("SIMULATED AGENT TRACE:")
    questions = [
        "What is 42 * 17 + 99?",
        "Tell me about LangChain",
    ]

    for q in questions:
        print(f"\n  Question: '{q}'")
        steps = fake_agent(q, tools)
        for label, content in steps:
            prefix = "  🧠" if label == "Thought" else "  ⚡" if label == "Action" else "  👁 " if label == "Observation" else "  ✅"
            print(f"{prefix} {label}: {content}")

    print("""
REAL LANGCHAIN CODE:
    from langchain_openai import ChatOpenAI
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain_community.tools import DuckDuckGoSearchRun
    from langchain_core.tools import tool

    # Define a custom tool
    @tool
    def get_word_length(word: str) -> int:
        "Returns the length of a word."
        return len(word)

    # Use built-in + custom tools
    tools = [DuckDuckGoSearchRun(), get_word_length]

    llm = ChatOpenAI(model="gpt-4o-mini")

    # ReAct agent
    from langchain import hub
    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    result = agent_executor.invoke({
        "input": "How many letters are in the word 'LangChain'? Then search what LangChain is."
    })
    print(result["output"])
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 9: Callbacks
# ─────────────────────────────────────────────────────────────────

def section_9_callbacks():
    """
    Callbacks let you hook into LangChain events for logging, streaming, monitoring.
    """
    print("\n" + "=" * 60)
    print("SECTION 9: Callbacks")
    print("=" * 60)

    print("""
CONCEPT:
  Callbacks fire during chain/LLM/agent execution.
  Use them for:
    • Logging (capture all prompts and responses)
    • Streaming (print tokens as they're generated)
    • Monitoring (LangSmith integration)
    • Custom logic (rate limiting, caching)

  Key callback events:
    on_llm_start     → before LLM is called
    on_llm_end       → after LLM responds
    on_chain_start   → before chain runs
    on_chain_end     → after chain completes
    on_tool_start    → before tool is used
    on_agent_action  → when agent decides an action
""")

    # Simulate a callback handler
    class LoggingCallbackHandler:
        def __init__(self):
            self.logs = []

        def on_llm_start(self, prompt):
            entry = f"[{datetime.now().strftime('%H:%M:%S')}] LLM START: '{prompt[:50]}...'"
            self.logs.append(entry)
            print(f"  📋 {entry}")

        def on_llm_end(self, response):
            entry = f"[{datetime.now().strftime('%H:%M:%S')}] LLM END:   '{response[:50]}...'"
            self.logs.append(entry)
            print(f"  ✅ {entry}")

        def on_chain_start(self, name):
            entry = f"[{datetime.now().strftime('%H:%M:%S')}] CHAIN START: {name}"
            self.logs.append(entry)
            print(f"  ⛓  {entry}")

        def on_chain_end(self):
            entry = f"[{datetime.now().strftime('%H:%M:%S')}] CHAIN END"
            self.logs.append(entry)
            print(f"  🏁 {entry}")

    print("SIMULATED CALLBACK TRACE:")
    cb = LoggingCallbackHandler()

    # Simulate chain execution with callbacks
    cb.on_chain_start("ExplainChain")
    time.sleep(0.1)
    cb.on_llm_start("Explain neural networks to a beginner.")
    time.sleep(0.1)
    cb.on_llm_end("Neural networks are systems inspired by the human brain...")
    cb.on_chain_end()

    print("""
REAL LANGCHAIN CODE:
    from langchain_core.callbacks import BaseCallbackHandler
    from langchain_openai import ChatOpenAI

    class MyLogger(BaseCallbackHandler):
        def on_llm_start(self, serialized, prompts, **kwargs):
            print(f"LLM called with: {prompts[0][:60]}")

        def on_llm_end(self, response, **kwargs):
            print(f"LLM responded: {response.generations[0][0].text[:60]}")

    llm = ChatOpenAI(callbacks=[MyLogger()])
    llm.invoke("What is 2+2?")

    # For streaming output token by token:
    from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
    streaming_llm = ChatOpenAI(
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()]
    )
    streaming_llm.invoke("Tell me a short story.")  # tokens print as generated
""")


# ─────────────────────────────────────────────────────────────────
# SECTION 10: Full Mini-App (Everything Together)
# ─────────────────────────────────────────────────────────────────

def section_10_full_mini_app():
    """
    A simulated mini Q&A assistant that combines:
    - Prompt Templates
    - Chains (LCEL style)
    - Memory
    - Output Parsing
    - Callbacks (logging)
    """
    print("\n" + "=" * 60)
    print("SECTION 10: Full Mini-App — 'Ask-Anything Assistant'")
    print("=" * 60)

    print("""
This simulates a full LangChain app with:
  ✓ Prompt Template
  ✓ Memory (conversation history)
  ✓ Fake LLM responses
  ✓ Logging callback
  ✓ Output parsing

Run it below, then see the real LangChain version at the end.
""")

    # Mini-app components
    class Memory:
        def __init__(self):
            self.history = []

        def add(self, role, msg):
            self.history.append((role, msg))

        def as_str(self):
            return "\n".join(f"{r}: {m}" for r, m in self.history[-6:])

    class PromptBuilder:
        def build(self, history, question):
            return f"""You are a helpful assistant.

Conversation history:
{history or '(none yet)'}

User: {question}
Assistant:"""

    class FakeLLM:
        RESPONSES = {
            "hello": "Hello! How can I help you today?",
            "langchain": "LangChain is a framework for building LLM-powered applications!",
            "memory": "Memory in LangChain stores past conversation turns to maintain context.",
            "agent": "Agents use tools dynamically — the LLM decides which tool to call!",
            "default": "That's an interesting question! Based on my knowledge, I can help with that.",
        }

        def respond(self, prompt):
            lower = prompt.lower()
            for k, v in self.RESPONSES.items():
                if k in lower:
                    return v
            return self.RESPONSES["default"]

    class Parser:
        def parse(self, text):
            return text.strip()

    class Logger:
        def log(self, event, data=""):
            print(f"  [LOG] {event}: {str(data)[:60]}")

    # Assemble the app
    memory = Memory()
    prompt_builder = PromptBuilder()
    llm = FakeLLM()
    parser = Parser()
    logger = Logger()

    def chat(user_input: str) -> str:
        logger.log("User input received", user_input)
        history = memory.as_str()
        prompt = prompt_builder.build(history, user_input)
        logger.log("Prompt built", prompt[:80])
        raw_response = llm.respond(prompt)
        logger.log("LLM responded", raw_response)
        response = parser.parse(raw_response)
        memory.add("User", user_input)
        memory.add("Assistant", response)
        return response

    # Run the conversation
    test_conversation = [
        "Hello!",
        "What is LangChain?",
        "How does memory work in it?",
        "And what about agents?",
    ]

    print("SIMULATED CHAT SESSION:")
    print("-" * 40)
    for user_msg in test_conversation:
        print(f"\n👤 User: {user_msg}")
        response = chat(user_msg)
        print(f"🤖 Bot:  {response}")

    print("""

REAL LANGCHAIN CODE FOR THIS APP:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.messages import HumanMessage, AIMessage

    llm = ChatOpenAI(model="gpt-4o-mini")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()

    history = []

    def chat(user_input: str) -> str:
        response = chain.invoke({"input": user_input, "history": history})
        history.append(HumanMessage(content=user_input))
        history.append(AIMessage(content=response))
        return response

    print(chat("Hello!"))
    print(chat("What is LangChain?"))
    print(chat("How does memory work?"))
""")


# ─────────────────────────────────────────────────────────────────
# MAIN — Run all sections
# ─────────────────────────────────────────────────────────────────

def main():
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         LangChain Explained Through Code — Not Just Theory       ║
╚══════════════════════════════════════════════════════════════════╝
""")
    section_1_what_is_langchain()
    section_2_llms_and_chat_models()
    section_3_prompt_templates()
    section_4_chains_lcel()
    section_5_output_parsers()
    section_6_memory()
    section_7_rag()
    section_8_agents_and_tools()
    section_9_callbacks()
    section_10_full_mini_app()

    print("\n" + "=" * 60)
    print("✅ ALL SECTIONS COMPLETE!")
    print("=" * 60)
    print("""
NEXT STEPS:
  1. Install LangChain:
       pip install langchain langchain-openai langchain-community

  2. Get an OpenAI API key from: https://platform.openai.com

  3. Replace YOUR_API_KEY in the real code examples above

  4. Explore:
       • LangSmith   → trace/debug your chains visually
       • LangServe   → deploy chains as REST APIs
       • LangGraph   → build stateful multi-agent workflows
       • LangHub     → community prompt templates

  Docs: https://python.langchain.com/docs/get_started/introduction
""")


if __name__ == "__main__":
    main()
