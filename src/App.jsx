import { useState, useRef, useEffect } from "react";

const SECTIONS = [
  { id: "intro", label: "What is LangChain?", icon: "⛓" },
  { id: "llm", label: "LLMs & Chat Models", icon: "🧠" },
  { id: "prompt", label: "Prompt Templates", icon: "📝" },
  { id: "chain", label: "Chains (LCEL)", icon: "🔗" },
  { id: "parser", label: "Output Parsers", icon: "🔍" },
  { id: "memory", label: "Memory", icon: "💾" },
  { id: "rag", label: "RAG Pipeline", icon: "📚" },
  { id: "agent", label: "Agents & Tools", icon: "🤖" },
  { id: "playground", label: "Live Playground", icon: "⚡" },
];

const CODE = {
  llm: `from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

chat = ChatOpenAI(model="gpt-4o-mini")

messages = [
  SystemMessage(content="You are a helpful teacher."),
  HumanMessage(content="Explain gravity simply."),
]

reply = chat.invoke(messages)
print(reply.content)`,

  prompt: `from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
  ("system", "You are an expert in {domain}."),
  ("human", "Answer this: {question}"),
])

# Format with variables
messages = template.format_messages(
  domain="astrophysics",
  question="What is a black hole?"
)

print(messages)`,

  chain: `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template(
  "Tell me a {style} joke about {topic}."
)
llm = ChatOpenAI(model="gpt-4o-mini")
parser = StrOutputParser()

# Chain with | operator (LCEL)
chain = prompt | llm | parser

result = chain.invoke({
  "topic": "Python",
  "style": "dad joke"
})
print(result)`,

  parser: `from langchain_core.output_parsers import (
  StrOutputParser,
  CommaSeparatedListOutputParser,
  JsonOutputParser,
)
from pydantic import BaseModel, Field

# Pydantic structured output
class Person(BaseModel):
  name: str = Field(description="person's name")
  age: int = Field(description="person's age")
  skills: list[str]

parser = JsonOutputParser(pydantic_object=Person)

# Plug into a chain
chain = prompt | llm | parser
result = chain.invoke({"input": "Alice, 30, Python expert"})
print(result.name, result.age)`,

  memory: `from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
  ("system", "You are a helpful assistant."),
  MessagesPlaceholder(variable_name="history"),
  ("human", "{input}"),
])

chain = prompt | llm | StrOutputParser()
history = []

def chat(user_input):
  response = chain.invoke({
    "input": user_input,
    "history": history
  })
  history.append(HumanMessage(content=user_input))
  history.append(AIMessage(content=response))
  return response

print(chat("My name is Priya"))
print(chat("What is my name?"))  # Remembers!`,

  rag: `from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# 1. Load documents
loader = TextLoader("my_document.txt")
docs = loader.load()

# 2. Split into chunks
splitter = RecursiveCharacterTextSplitter(
  chunk_size=500, chunk_overlap=50
)
chunks = splitter.split_documents(docs)

# 3. Embed & store in vector DB
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(chunks, embeddings)

# 4. Build retrieval chain
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
qa = RetrievalQA.from_chain_type(llm=ChatOpenAI(), retriever=retriever)

# 5. Ask questions!
answer = qa.invoke("What does the document say about X?")
print(answer["result"])`,

  agent: `from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
from langchain import hub

@tool
def calculator(expression: str) -> str:
  "Evaluates a math expression."
  return str(eval(expression))

tools = [DuckDuckGoSearchRun(), calculator]
llm = ChatOpenAI(model="gpt-4o-mini")
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({
  "input": "What is 42 * 17? Also search what LangChain is."
})
print(result["output"])`,
};

// ── Fake LLM responses for interactive demos ──
const FAKE_RESPONSES = {
  "explain machine learning": "Machine Learning is a way computers learn from data without being explicitly programmed. Think of it like teaching a dog tricks — instead of giving it rules, you show it examples until it gets it right! 🐕",
  "explain python": "Python is a beginner-friendly programming language known for its clean, readable syntax. It's like English for computers — simple, expressive, and incredibly powerful for data science, web development, and AI.",
  "explain neural networks": "Neural networks are computational systems loosely inspired by the human brain. They consist of layers of interconnected 'neurons' that transform input data into predictions. Deep learning = many layers!",
  "tell me a joke about python": "Why do Python programmers wear glasses? 👓 Because they can't C! (C is another programming language — get it?)",
  "tell me a joke about ai": "Why did the AI go to therapy? 🤖 It had too many deep issues it couldn't process! (Deep learning pun intended)",
  "default": "That's a great question! As a simulated LangChain demo, I can show you how real LLM responses would look here. In a real app, this would call OpenAI/Anthropic and stream back a full answer.",
};

function getFakeResponse(input) {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(FAKE_RESPONSES)) {
    if (key !== "default" && lower.includes(key.replace("tell me a joke about ", "").replace("explain ", ""))) {
      if (lower.includes("joke") && key.includes("joke")) return val;
      if (!lower.includes("joke") && !key.includes("joke")) return val;
    }
  }
  return FAKE_RESPONSES["default"];
}

// ── Typing animation hook ──
function useTyping(text, speed = 18, active = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active || !text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, active]);
  return { displayed, done };
}

// ── Code block ──
function CodeBlock({ code, highlight = [] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      <pre style={{
        background: "#0d1117", color: "#e6edf3", padding: "20px 20px 20px 20px",
        borderRadius: 10, fontSize: 13, lineHeight: 1.7, overflowX: "auto",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        border: "1px solid #30363d", margin: 0,
      }}>
        {code.split("\n").map((line, i) => (
          <div key={i} style={{
            background: highlight.includes(i) ? "rgba(255,210,0,0.08)" : "transparent",
            borderLeft: highlight.includes(i) ? "3px solid #ffd700" : "3px solid transparent",
            paddingLeft: highlight.includes(i) ? 8 : 8,
            marginLeft: -8,
          }}>
            <span style={{ color: "#6e7681", marginRight: 16, userSelect: "none", fontSize: 11 }}>{String(i + 1).padStart(2, " ")}</span>
            {colorize(line)}
          </div>
        ))}
      </pre>
      <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{
          position: "absolute", top: 10, right: 10,
          background: copied ? "#238636" : "#21262d", color: copied ? "#fff" : "#8b949e",
          border: "1px solid #30363d", borderRadius: 6, padding: "4px 10px",
          fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
        }}>
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function colorize(line) {
  const keywords = ["from", "import", "def", "class", "return", "print", "for", "in", "if", "else"];
  const strings = line.match(/("[^"]*"|'[^']*')/g) || [];
  const comments = line.match(/#.*/g) || [];
  if (comments.length) {
    const idx = line.indexOf("#");
    return <><span>{colorize(line.slice(0, idx))}</span><span style={{ color: "#8b949e" }}>{line.slice(idx)}</span></>;
  }
  const parts = line.split(/(\b(?:from|import|def|class|return|print|for|in|if|else)\b|"[^"]*"|'[^']*')/g);
  return parts.map((p, i) => {
    if (keywords.includes(p)) return <span key={i} style={{ color: "#ff7b72" }}>{p}</span>;
    if (p.startsWith('"') || p.startsWith("'")) return <span key={i} style={{ color: "#a5d6ff" }}>{p}</span>;
    if (/^[A-Z][A-Za-z]+$/.test(p)) return <span key={i} style={{ color: "#ffa657" }}>{p}</span>;
    return <span key={i} style={{ color: "#e6edf3" }}>{p}</span>;
  });
}

// ── Section components ──

function IntroSection() {
  const blocks = [
    { icon: "🧠", label: "Model I/O", desc: "Talk to LLMs & Chat models", color: "#f0a500" },
    { icon: "📝", label: "Prompts", desc: "Template & format inputs", color: "#00c9a7" },
    { icon: "🔗", label: "Chains", desc: "Compose steps with | operator", color: "#7c83fd" },
    { icon: "💾", label: "Memory", desc: "Remember conversations", color: "#fd7c7c" },
    { icon: "📚", label: "Retrieval", desc: "Search your documents (RAG)", color: "#4db6ff" },
    { icon: "🤖", label: "Agents", desc: "LLM decides what tools to use", color: "#a8ff78" },
  ];
  return (
    <div>
      <p style={{ color: "#aaa", lineHeight: 1.8, marginBottom: 24, fontSize: 15 }}>
        <strong style={{ color: "#fff" }}>LangChain</strong> is a framework for building applications powered by Large Language Models.
        It provides composable building blocks — chain them together like LEGO pieces to build chatbots, document search, AI agents, and more.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {blocks.map((b) => (
          <div key={b.label} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "18px 20px", transition: "transform .2s, border-color .2s",
            cursor: "default",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = b.color; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
            <div style={{ color: b.color, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.label}</div>
            <div style={{ color: "#888", fontSize: 13 }}>{b.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "16px 20px" }}>
        <div style={{ color: "#ffd700", fontWeight: 700, marginBottom: 8 }}>📦 Install LangChain</div>
        <code style={{ color: "#a8ff78", fontFamily: "monospace", fontSize: 13 }}>pip install langchain langchain-openai langchain-community</code>
      </div>
    </div>
  );
}

function LLMSection() {
  const [input, setInput] = useState("Explain quantum computing in simple terms.");
  const [model, setModel] = useState("gpt-4o-mini");
  const [mode, setMode] = useState("chat");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { displayed } = useTyping(response, 12, !!response);

  const run = () => {
    setLoading(true);
    setResponse("");
    setTimeout(() => {
      setResponse(getFakeResponse(input));
      setLoading(false);
    }, 800);
  };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 20, lineHeight: 1.7 }}>
        LangChain wraps different LLM providers under a single interface. Swap between OpenAI, Anthropic, Mistral, and others without changing your app logic.
      </p>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {["chat", "llm"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            background: mode === m ? "#f0a500" : "rgba(255,255,255,0.08)",
            color: mode === m ? "#000" : "#aaa", fontWeight: 600, fontSize: 13,
          }}>{m === "chat" ? "ChatModel" : "LLM (text)"}</button>
        ))}
        <select value={model} onChange={e => setModel(e.target.value)} style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 13,
        }}>
          <option>gpt-4o-mini</option>
          <option>gpt-4o</option>
          <option>claude-3-sonnet</option>
          <option>mistral-7b</option>
        </select>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        style={{
          width: "100%", minHeight: 80, background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff",
          padding: "12px 16px", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box"
        }} />
      <button onClick={run} style={{
        marginTop: 10, padding: "10px 28px", background: "#f0a500", color: "#000",
        border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14,
      }}>▶ Invoke</button>
      {loading && <div style={{ marginTop: 14, color: "#f0a500", fontSize: 14 }}>⏳ Calling LLM...</div>}
      {response && (
        <div style={{ marginTop: 14, background: "rgba(240,165,0,0.07)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: "#f0a500", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🤖 {model} response:</div>
          <div style={{ color: "#e0e0e0", lineHeight: 1.7, fontSize: 14 }}>{displayed}</div>
        </div>
      )}
      <CodeBlock code={CODE.llm} highlight={[6, 7, 8, 9, 11]} />
    </div>
  );
}

function PromptSection() {
  const [domain, setDomain] = useState("astrophysics");
  const [question, setQuestion] = useState("What is a black hole?");
  const [topic, setTopic] = useState("Machine Learning");
  const [level, setLevel] = useState("beginner");

  const chatPrompt = `System: You are an expert in ${domain}.\nHuman: Answer this: ${question}`;
  const simplePrompt = `Explain ${topic} to a ${level} student in 3 bullet points.`;

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 20, lineHeight: 1.7 }}>
        Prompt Templates let you write <strong style={{ color: "#fff" }}>reusable, parameterized prompts</strong> — stop hardcoding strings. They're composable and plug directly into chains.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ color: "#00c9a7", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>📌 Simple Prompt Template</div>
          <label style={{ color: "#888", fontSize: 12 }}>Topic</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} style={inputStyle} />
          <label style={{ color: "#888", fontSize: 12, marginTop: 8, display: "block" }}>Level</label>
          <select value={level} onChange={e => setLevel(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {["beginner", "intermediate", "expert", "PhD", "5-year-old"].map(l => <option key={l}>{l}</option>)}
          </select>
          <div style={{ marginTop: 14, background: "#0d1117", borderRadius: 8, padding: "12px 14px", border: "1px solid #30363d" }}>
            <div style={{ color: "#6e7681", fontSize: 11, marginBottom: 4 }}>RENDERED PROMPT</div>
            <div style={{ color: "#a5d6ff", fontFamily: "monospace", fontSize: 13 }}>{simplePrompt}</div>
          </div>
        </div>
        <div>
          <div style={{ color: "#00c9a7", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>💬 Chat Prompt Template</div>
          <label style={{ color: "#888", fontSize: 12 }}>Domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} style={inputStyle} />
          <label style={{ color: "#888", fontSize: 12, marginTop: 8, display: "block" }}>Question</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} style={inputStyle} />
          <div style={{ marginTop: 14, background: "#0d1117", borderRadius: 8, padding: "12px 14px", border: "1px solid #30363d" }}>
            <div style={{ color: "#6e7681", fontSize: 11, marginBottom: 4 }}>RENDERED MESSAGES</div>
            {chatPrompt.split("\n").map((line, i) => (
              <div key={i} style={{ fontFamily: "monospace", fontSize: 13, color: i === 0 ? "#ffa657" : "#a5d6ff", marginBottom: 4 }}>{line}</div>
            ))}
          </div>
        </div>
      </div>
      <CodeBlock code={CODE.prompt} highlight={[2, 3, 4, 5, 8, 9, 10]} />
    </div>
  );
}

function ChainSection() {
  const [topic, setTopic] = useState("Python");
  const [style, setStyle] = useState("dad joke");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [output, setOutput] = useState("");

  const steps = [
    { label: "PromptTemplate", color: "#7c83fd", output: `"Tell me a ${style} about ${topic}."` },
    { label: "ChatOpenAI", color: "#f0a500", output: `AIMessage(content="[LLM processing...]")` },
    { label: "StrOutputParser", color: "#00c9a7", output: `"Why did the ${topic} programmer quit? Too many bytes!"` },
  ];

  const run = () => {
    setRunning(true);
    setStep(0);
    setOutput("");
    let s = 0;
    const next = setInterval(() => {
      s++;
      setStep(s);
      if (s >= steps.length) {
        clearInterval(next);
        setOutput(`Why did the ${topic} programmer quit? They couldn't handle all the ${style === "dad joke" ? "bytes" : "exceptions"}! 😄`);
        setRunning(false);
      }
    }, 900);
  };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 20, lineHeight: 1.7 }}>
        LCEL (LangChain Expression Language) chains components with the <code style={{ color: "#f0a500" }}>|</code> operator — like Unix pipes. Every component has <code style={{ color: "#a5d6ff" }}>.invoke()</code>, <code style={{ color: "#a5d6ff" }}>.batch()</code>, and <code style={{ color: "#a5d6ff" }}>.stream()</code>.
      </p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ color: "#888", fontSize: 12 }}>Topic</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} style={{ ...inputStyle, width: 140 }} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: 12 }}>Style</label>
          <select value={style} onChange={e => setStyle(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            {["dad joke", "dry humor", "sarcastic", "nerdy", "pun"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Chain visualization */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "20px 0", flexWrap: "wrap" }}>
        {["Input", ...steps.map(s => s.label), "Output"].map((name, i, arr) => (
          <div key={name} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              padding: "8px 14px", borderRadius: 8,
              background: i === 0 ? "rgba(255,255,255,0.08)" : i === arr.length - 1 ? "rgba(0,201,167,0.15)" : `${steps[i - 1]?.color}22`,
              border: `1px solid ${i === 0 ? "rgba(255,255,255,0.2)" : i === arr.length - 1 ? "#00c9a7" : steps[i - 1]?.color}`,
              color: i === arr.length - 1 ? "#00c9a7" : i === 0 ? "#fff" : steps[i - 1]?.color,
              fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
              opacity: step >= i - 1 || step === -1 ? 1 : 0.3,
              transition: "opacity .4s",
              boxShadow: step === i - 1 ? `0 0 12px ${steps[i - 1]?.color}88` : "none",
            }}>{name}</div>
            {i < arr.length - 1 && (
              <div style={{
                color: step > i - 1 ? "#fff" : "#444", fontSize: 18, margin: "0 4px", transition: "color .4s"
              }}>→</div>
            )}
          </div>
        ))}
      </div>

      {step >= 0 && step < steps.length && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, border: `1px solid ${steps[Math.min(step, steps.length - 1)]?.color}44` }}>
          <span style={{ color: steps[Math.min(step, steps.length - 1)]?.color, fontWeight: 700, fontSize: 12 }}>
            ▶ {steps[Math.min(step, steps.length - 1)]?.label}
          </span>
          <span style={{ color: "#888", fontSize: 12, marginLeft: 10 }}>
            → {steps[Math.min(step, steps.length - 1)]?.output}
          </span>
        </div>
      )}

      <button onClick={run} disabled={running} style={{
        padding: "10px 28px", background: running ? "#333" : "#7c83fd",
        color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: running ? "not-allowed" : "pointer",
      }}>
        {running ? "Running chain..." : "▶ Run Chain"}
      </button>

      {output && (
        <div style={{ marginTop: 12, background: "rgba(0,201,167,0.08)", border: "1px solid #00c9a7", borderRadius: 8, padding: "12px 16px" }}>
          <span style={{ color: "#00c9a7", fontWeight: 700, fontSize: 12 }}>✓ Final Output: </span>
          <span style={{ color: "#e0e0e0", fontSize: 14 }}>{output}</span>
        </div>
      )}
      <CodeBlock code={CODE.chain} highlight={[11, 12, 15]} />
    </div>
  );
}

function ParserSection() {
  const [raw, setRaw] = useState('{"name": "Alice", "age": 30, "skills": ["Python", "ML"]}');
  const [mode, setMode] = useState("json");

  const parse = () => {
    if (mode === "json") { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return "❌ Invalid JSON"; } }
    if (mode === "list") return raw.split(",").map(s => `• ${s.trim()}`).join("\n");
    return raw.trim();
  };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 20, lineHeight: 1.7 }}>
        Output parsers transform raw LLM text into <strong style={{ color: "#fff" }}>structured Python objects</strong> — strings, lists, dicts, Pydantic models. This makes LLM output usable in your app logic.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["str", "list", "json"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: mode === m ? "#fd7c7c" : "rgba(255,255,255,0.08)",
            color: mode === m ? "#000" : "#aaa", fontWeight: 600, fontSize: 12,
          }}>{m === "str" ? "StrOutputParser" : m === "list" ? "ListParser" : "JsonOutputParser"}</button>
        ))}
      </div>
      <label style={{ color: "#888", fontSize: 12 }}>Raw LLM Output</label>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical", marginTop: 4 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <div style={{ color: "#6e7681", fontSize: 11, marginBottom: 6 }}>INPUT (raw text)</div>
          <pre style={{ background: "#0d1117", color: "#ff7b72", padding: 14, borderRadius: 8, fontSize: 12, overflow: "auto", border: "1px solid #30363d" }}>{raw}</pre>
        </div>
        <div>
          <div style={{ color: "#6e7681", fontSize: 11, marginBottom: 6 }}>PARSED OUTPUT ({mode})</div>
          <pre style={{ background: "#0d1117", color: "#a8ff78", padding: 14, borderRadius: 8, fontSize: 12, overflow: "auto", border: "1px solid #30363d" }}>{parse()}</pre>
        </div>
      </div>
      <CodeBlock code={CODE.parser} highlight={[3, 4, 8, 9, 10, 11]} />
    </div>
  );
}

function MemorySection() {
  const [history, setHistory] = useState([
    { role: "assistant", content: "Hi! I'm a LangChain-powered assistant with memory. Tell me your name!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const MEMORY_RESPONSES = (msg, hist) => {
    const lower = msg.toLowerCase();
    const names = hist.filter(h => h.role === "user").map(h => h.content).join(" ");
    const nameMatch = names.match(/(?:my name is|i'm|i am|call me)\s+([A-Za-z]+)/i);
    if (lower.includes("what") && lower.includes("name") && nameMatch) return `Your name is ${nameMatch[1]}! I remembered it because I have memory 🧠`;
    if (lower.match(/my name is|i'm|i am|call me/i)) { const n = msg.match(/(?:my name is|i'm|i am|call me)\s+([A-Za-z]+)/i); return n ? `Nice to meet you, ${n[1]}! I'll remember that.` : "Got it, I'll remember your name!"; }
    if (lower.includes("what did i say")) return `You've said ${hist.filter(h => h.role === "user").length} message(s) so far. I remember everything in our conversation!`;
    if (lower.includes("langchain")) return "LangChain is great! It's the framework powering this demo. Memory is one of its coolest features.";
    return getFakeResponse(msg);
  };

  const send = () => {
    if (!input.trim()) return;
    const newHistory = [...history, { role: "user", content: input }];
    setHistory(newHistory);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const reply = MEMORY_RESPONSES(input, newHistory);
      setHistory(h => [...h, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 700);
  };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 16, lineHeight: 1.7 }}>
        Without memory, every LLM call is stateless. LangChain Memory injects conversation history into each new prompt. <strong style={{ color: "#fff" }}>Try telling it your name, then asking "what's my name?"</strong>
      </p>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a8ff78" }} />
          <span style={{ color: "#888", fontSize: 12 }}>Memory-powered chatbot • {history.length} messages in context</span>
        </div>
        <div style={{ height: 260, overflowY: "auto", padding: "16px" }}>
          {history.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#fd7c7c" : "rgba(255,255,255,0.08)",
                color: msg.role === "user" ? "#000" : "#e0e0e0", fontSize: 14, lineHeight: 1.5,
              }}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 6, padding: "8px 14px" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#fd7c7c", animation: `pulse 1s ${i * 0.2}s infinite` }} />)}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Try: 'My name is Alex' then 'What is my name?'"
            style={{ ...inputStyle, flex: 1, margin: 0 }} />
          <button onClick={send} style={{
            padding: "8px 20px", background: "#fd7c7c", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
          }}>Send</button>
        </div>
      </div>
      <div style={{ marginTop: 16, background: "rgba(253,124,124,0.06)", border: "1px solid rgba(253,124,124,0.2)", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: "#fd7c7c", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🧠 Memory Buffer ({history.length} messages)</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", maxHeight: 80, overflow: "auto" }}>
          {history.map((m, i) => <div key={i}>{m.role === "user" ? "Human" : "AI"}: {m.content.slice(0, 60)}{m.content.length > 60 ? "..." : ""}</div>)}
        </div>
      </div>
      <CodeBlock code={CODE.memory} highlight={[11, 12, 13, 14, 15, 16, 17]} />
    </div>
  );
}

function RAGSection() {
  const DOCS = [
    { id: 1, text: "LangChain is a framework for building LLM-powered applications with 90k+ GitHub stars.", tags: ["langchain"] },
    { id: 2, text: "LangChain supports OpenAI, Anthropic, Mistral, and many other LLM providers.", tags: ["langchain", "llm"] },
    { id: 3, text: "Vector databases store high-dimensional embeddings for fast semantic similarity search.", tags: ["vector", "database"] },
    { id: 4, text: "RAG combines retrieval with generation to answer questions about your own documents.", tags: ["rag", "retrieval"] },
    { id: 5, text: "Agents in LangChain use tools to complete multi-step tasks autonomously.", tags: ["agent", "tools"] },
    { id: 6, text: "The FAISS library provides efficient similarity search for millions of vectors.", tags: ["vector", "faiss"] },
  ];
  const [query, setQuery] = useState("What is RAG?");
  const [retrieved, setRetrieved] = useState([]);
  const [answer, setAnswer] = useState("");
  const [step, setStep] = useState(0);

  const search = () => {
    setStep(1);
    setTimeout(() => {
      const lower = query.toLowerCase();
      const scored = DOCS.map(d => {
        const score = d.tags.filter(t => lower.includes(t)).length + (lower.split(" ").filter(w => d.text.toLowerCase().includes(w) && w.length > 3).length * 0.3);
        return { ...d, score };
      }).sort((a, b) => b.score - a.score).slice(0, 2);
      setRetrieved(scored);
      setStep(2);
      setTimeout(() => {
        setAnswer(`Based on the retrieved documents: ${scored.map(d => d.text).join(" ")} — This answers your question about "${query}".`);
        setStep(3);
      }, 800);
    }, 600);
  };

  const stepColors = ["#888", "#f0a500", "#7c83fd", "#00c9a7"];
  const stepLabels = ["Ready", "Embedding query...", "Retrieving similar docs...", "Generating answer"];

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 16, lineHeight: 1.7 }}>
        RAG (Retrieval-Augmented Generation) gives your LLM access to <strong style={{ color: "#fff" }}>your own documents</strong> at query time — no fine-tuning needed. Documents are embedded as vectors, then retrieved by similarity.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ color: "#4db6ff", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📄 Document Store ({DOCS.length} chunks)</div>
          {DOCS.map(d => (
            <div key={d.id} style={{
              padding: "8px 12px", marginBottom: 6, borderRadius: 6, fontSize: 12, lineHeight: 1.5,
              background: retrieved.find(r => r.id === d.id) ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${retrieved.find(r => r.id === d.id) ? "#00c9a7" : "rgba(255,255,255,0.08)"}`,
              color: retrieved.find(r => r.id === d.id) ? "#00c9a7" : "#888",
              transition: "all .4s",
            }}>
              {retrieved.find(r => r.id === d.id) && <span style={{ marginRight: 6 }}>✓</span>}
              {d.text}
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: "#4db6ff", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔍 Query Interface</div>
          <input value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} placeholder="Ask anything..." />
          <div style={{ marginBottom: 10 }}>
            {["What is RAG?", "How does LangChain work?", "What is FAISS?"].map(q => (
              <button key={q} onClick={() => setQuery(q)} style={{
                padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 12, border: "1px solid rgba(77,182,255,0.3)",
                background: "transparent", color: "#4db6ff", fontSize: 11, cursor: "pointer"
              }}>{q}</button>
            ))}
          </div>
          <button onClick={search} style={{
            width: "100%", padding: "10px", background: "#4db6ff", color: "#000",
            border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer",
          }}>▶ Run RAG Pipeline</button>

          <div style={{ marginTop: 14 }}>
            {["Embed", "Retrieve", "Generate"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: step > i ? stepColors[i + 1] : "rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 700,
                  color: step > i ? "#000" : "#666", transition: "all .4s",
                }}>{step > i ? "✓" : i + 1}</div>
                <span style={{ color: step > i ? stepColors[i + 1] : "#555", fontSize: 13, transition: "color .4s" }}>{stepLabels[i + 1]}</span>
              </div>
            ))}
          </div>
          {answer && (
            <div style={{ marginTop: 10, background: "rgba(0,201,167,0.08)", border: "1px solid #00c9a7", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#00c9a7", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🤖 RAG Answer</div>
              <div style={{ color: "#ccc", fontSize: 12, lineHeight: 1.6 }}>{answer.slice(0, 200)}...</div>
            </div>
          )}
        </div>
      </div>
      <CodeBlock code={CODE.rag} highlight={[15, 16, 19, 20, 23, 24, 27, 28]} />
    </div>
  );
}

function AgentSection() {
  const [task, setTask] = useState("What is 42 * 17? Also tell me about LangChain.");
  const [trace, setTrace] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const TOOLS = {
    calculator: (expr) => { try { return String(eval(expr.match(/[\d\s\+\-\*\/\.]+/)?.[0] || "0")); } catch { return "Error"; } },
    search: (q) => q.toLowerCase().includes("langchain") ? "LangChain is an LLM framework with 90k+ GitHub stars." : `Search result: "${q}" — [simulated web result]`,
  };

  const run = () => {
    setTrace([]);
    setDone(false);
    setRunning(true);
    const lower = task.toLowerCase();
    const steps = [];
    if (lower.match(/\d+\s*[\*\/\+\-]\s*\d+/)) {
      const expr = task.match(/\d+\s*[\*\/\+\-]\s*\d+/)?.[0];
      steps.push({ type: "thought", content: "I see a math expression. I should use the calculator tool." });
      steps.push({ type: "action", content: `calculator("${expr}")` });
      steps.push({ type: "observation", content: TOOLS.calculator(expr) });
    }
    if (lower.includes("langchain") || lower.includes("search") || lower.includes("tell me about")) {
      const searchQ = lower.includes("langchain") ? "LangChain framework" : task.replace(/.*about\s*/i, "");
      steps.push({ type: "thought", content: "I need to search the web for this information." });
      steps.push({ type: "action", content: `search("${searchQ}")` });
      steps.push({ type: "observation", content: TOOLS.search(searchQ) });
    }
    const obs = steps.filter(s => s.type === "observation").map(s => s.content);
    steps.push({ type: "final", content: obs.join(" ") || "I've completed the task based on my tools." });

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) { setTrace(t => [...t, steps[i]]); i++; }
      else { clearInterval(interval); setRunning(false); setDone(true); }
    }, 700);
  };

  const typeColors = { thought: "#f0a500", action: "#7c83fd", observation: "#4db6ff", final: "#00c9a7" };
  const typeIcons = { thought: "🧠", action: "⚡", observation: "👁", final: "✅" };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 16, lineHeight: 1.7 }}>
        Agents let the LLM <strong style={{ color: "#fff" }}>decide which tools to use</strong>. It reasons in a loop: Thought → Action → Observation, until it has enough info to answer. This is the <strong style={{ color: "#fff" }}>ReAct pattern</strong>.
      </p>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {["calculator", "search"].map(t => (
          <div key={t} style={{ padding: "6px 14px", background: "rgba(124,131,253,0.1)", border: "1px solid rgba(124,131,253,0.3)", borderRadius: 20, color: "#7c83fd", fontSize: 12, fontWeight: 600 }}>
            🔧 {t}
          </div>
        ))}
      </div>
      <textarea value={task} onChange={e => setTask(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "none" }} />
      <div style={{ display: "flex", gap: 8, margin: "8px 0 14px" }}>
        {["What is 42 * 17?", "Tell me about LangChain", "Calculate 100 / 4 and search for Python"].map(t => (
          <button key={t} onClick={() => setTask(t)} style={{
            padding: "4px 10px", borderRadius: 12, border: "1px solid rgba(124,131,253,0.3)",
            background: "transparent", color: "#7c83fd", fontSize: 11, cursor: "pointer"
          }}>{t.slice(0, 20)}...</button>
        ))}
      </div>
      <button onClick={run} disabled={running} style={{
        padding: "10px 28px", background: running ? "#333" : "#7c83fd", color: running ? "#666" : "#fff",
        border: "none", borderRadius: 8, fontWeight: 700, cursor: running ? "not-allowed" : "pointer",
      }}>▶ Run Agent</button>

      {trace.length > 0 && (
        <div style={{ marginTop: 16, background: "#0a0a0a", border: "1px solid #222", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#555", fontSize: 11, marginBottom: 12, fontWeight: 700 }}>AGENT EXECUTION TRACE</div>
          {trace.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, animation: "fadeIn .3s ease" }}>
              <div style={{ color: typeColors[step.type], fontSize: 18, minWidth: 24 }}>{typeIcons[step.type]}</div>
              <div>
                <div style={{ color: typeColors[step.type], fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{step.type}</div>
                <div style={{ color: step.type === "final" ? "#e0e0e0" : "#aaa", fontSize: 13, fontFamily: step.type === "action" ? "monospace" : "inherit" }}>{step.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <CodeBlock code={CODE.agent} highlight={[4, 5, 6, 9, 12, 13, 14, 15, 17, 18]} />
    </div>
  );
}

function PlaygroundSection() {
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant that explains technical concepts clearly.");
  const [userMsg, setUserMsg] = useState("Explain what embeddings are in 2 sentences.");
  const [parser, setParser] = useState("str");
  const [useMemory, setUseMemory] = useState(true);
  const [history, setHistory] = useState([]);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { displayed } = useTyping(response, 10, !!response);

  const run = () => {
    setLoading(true);
    setResponse("");
    setTimeout(() => {
      const raw = getFakeResponse(userMsg);
      const parsed = parser === "list" ? raw.split(". ").map((s, i) => `${i + 1}. ${s}`).join("\n") : raw;
      setResponse(parsed);
      if (useMemory) setHistory(h => [...h, { user: userMsg, ai: parsed }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div>
      <p style={{ color: "#aaa", marginBottom: 20, lineHeight: 1.7 }}>
        Combine everything: system prompt, memory, output parser — in one interactive playground. Build your own mini-chain!
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <label style={{ color: "#888", fontSize: 12 }}>🔧 System Prompt</label>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginTop: 4 }} />

          <label style={{ color: "#888", fontSize: 12, marginTop: 12, display: "block" }}>💬 User Message</label>
          <textarea value={userMsg} onChange={e => setUserMsg(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical", marginTop: 4 }} />

          <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center" }}>
            <div>
              <label style={{ color: "#888", fontSize: 12 }}>Output Parser</label>
              <select value={parser} onChange={e => setParser(e.target.value)} style={{ ...inputStyle, marginTop: 4, width: 140 }}>
                <option value="str">StrOutputParser</option>
                <option value="list">ListParser</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 14 }}>
              <div onClick={() => setUseMemory(!useMemory)} style={{
                width: 36, height: 20, borderRadius: 10,
                background: useMemory ? "#a8ff78" : "#333", position: "relative", transition: "background .3s",
              }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: useMemory ? 18 : 2, transition: "left .3s" }} />
              </div>
              <span style={{ color: "#aaa", fontSize: 12 }}>Memory</span>
            </label>
          </div>

          <button onClick={run} disabled={loading} style={{
            marginTop: 14, width: "100%", padding: "12px", background: loading ? "#333" : "#a8ff78",
            color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 14,
          }}>
            {loading ? "⏳ Running..." : "▶ Run Chain"}
          </button>
        </div>

        <div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>📊 Chain Output</div>
          <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 16, minHeight: 180 }}>
            {!response && !loading && (
              <div style={{ color: "#444", fontSize: 13, textAlign: "center", paddingTop: 60 }}>
                Run the chain to see output here ↑
              </div>
            )}
            {loading && <div style={{ color: "#a8ff78", fontSize: 13 }}>⏳ Processing chain...</div>}
            {response && <pre style={{ color: "#a8ff78", fontSize: 13, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{displayed}</pre>}
          </div>

          {useMemory && history.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>💾 Memory Buffer ({history.length} turns)</div>
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: 12, maxHeight: 120, overflow: "auto" }}>
                {history.map((h, i) => (
                  <div key={i} style={{ marginBottom: 8, fontSize: 11 }}>
                    <div style={{ color: "#fd7c7c" }}>Human: {h.user.slice(0, 50)}...</div>
                    <div style={{ color: "#a8ff78" }}>AI: {h.ai.slice(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 16 }}>
        <div style={{ color: "#6e7681", fontSize: 11, marginBottom: 8 }}>GENERATED LCEL CODE</div>
        <pre style={{ color: "#e6edf3", fontFamily: "monospace", fontSize: 12, margin: 0 }}>
{`from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import ${parser === "list" ? "CommaSeparatedListOutputParser" : "StrOutputParser"}

prompt = ChatPromptTemplate.from_messages([
    ("system", "${systemPrompt.slice(0, 50)}..."),
    ${useMemory ? 'MessagesPlaceholder(variable_name="history"),' : ""}
    ("human", "{input}"),
])
chain = prompt | ChatOpenAI() | ${parser === "list" ? "CommaSeparatedListOutputParser" : "StrOutputParser"}()
result = chain.invoke({"input": "${userMsg.slice(0, 40)}..."${useMemory ? ', "history": history' : ""}})`}
        </pre>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", display: "block",
};

const SECTION_COMPONENTS = {
  intro: IntroSection, llm: LLMSection, prompt: PromptSection, chain: ChainSection,
  parser: ParserSection, memory: MemorySection, rag: RAGSection, agent: AgentSection, playground: PlaygroundSection,
};

export default function App() {
  const [active, setActive] = useState("intro");
  const [menuOpen, setMenuOpen] = useState(false);
  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0e", color: "#fff", fontFamily: "'Syne', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input, textarea, select { outline: none; }
        input:focus, textarea:focus, select:focus { border-color: rgba(255,255,255,0.3) !important; }
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px",
        background: "rgba(10,11,14,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 22 }}>⛓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>LangChain Explorer</div>
            <div style={{ color: "#555", fontSize: 11 }}>Interactive Learning — Not Just Theory</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["#f0a500", "#00c9a7", "#7c83fd", "#fd7c7c"].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: 0.8 }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <div style={{
          width: 220, borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 0", background: "rgba(255,255,255,0.01)", flexShrink: 0,
        }}>
          <div style={{ padding: "0 12px 8px", color: "#444", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Sections</div>
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              width: "100%", textAlign: "left", padding: "10px 16px",
              background: active === s.id ? "rgba(255,255,255,0.06)" : "transparent",
              border: "none", borderLeft: `3px solid ${active === s.id ? "#f0a500" : "transparent"}`,
              color: active === s.id ? "#fff" : "#666", cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", fontWeight: active === s.id ? 600 : 400,
              transition: "all .15s", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}

          <div style={{ margin: "24px 12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
            <div style={{ color: "#444", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Install</div>
            <div style={{ background: "#0d1117", borderRadius: 6, padding: "8px 10px", fontSize: 10, fontFamily: "monospace", color: "#a8ff78", lineHeight: 1.8 }}>
              pip install<br />langchain<br />langchain-openai<br />langchain-community
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxWidth: 900 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {SECTIONS.find(s => s.id === active)?.icon} {SECTIONS.find(s => s.id === active)?.label}
            </h1>
            <div style={{ height: 2, width: 48, background: "#f0a500", borderRadius: 2 }} />
          </div>
          <div style={{ animation: "fadeIn .3s ease" }} key={active}>
            <ActiveSection />
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {SECTIONS.findIndex(s => s.id === active) > 0 ? (
              <button onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) - 1].id)} style={{
                padding: "8px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                color: "#aaa", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              }}>← Previous</button>
            ) : <div />}
            {SECTIONS.findIndex(s => s.id === active) < SECTIONS.length - 1 && (
              <button onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) + 1].id)} style={{
                padding: "8px 18px", background: "#f0a500", border: "none",
                color: "#000", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700,
              }}>Next →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}