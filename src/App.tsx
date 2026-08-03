import { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Lightbulb,
  CheckCircle2,
  ListChecks,
  User,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  HelpCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Backpack,
  BarChart2,
  Dices,
  BookOpen,
  Trophy,
  Loader2,
  Plus
} from 'lucide-react';

// Define TS Types for AI Workspace Outputs
interface MindmapBranch {
  id: number;
  title: string;
  subtopics: string[];
}

interface MindmapData {
  topic: string;
  branches: MindmapBranch[];
}

interface ItineraryActivity {
  time: string;
  activity: string;
  location?: string;
}

interface ItineraryDay {
  day: string;
  theme: string;
  activities: ItineraryActivity[];
}

interface ItineraryData {
  title: string;
  destination: string;
  duration: string;
  packingList: string[];
  schedule: ItineraryDay[];
}

interface CharacterAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
}

interface CharacterData {
  name: string;
  class: string;
  role: string;
  attributes: CharacterAttributes;
  backstory: string;
  inventory: string[];
}

interface QuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface QuizData {
  quizTitle: string;
  description: string;
  questions: QuizQuestion[];
}

type WorkspaceTab = 'mindmap' | 'prompt' | 'blueprint';
type BlueprintType = 'itinerary' | 'character' | 'quiz';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('mindmap');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Mindmap
  const [mindmapPrompt, setMindmapPrompt] = useState('Sustainable Urban Architecture in 2050');
  const [mindmapResult, setMindmapResult] = useState<MindmapData | null>({
    topic: "Sustainable Urban Architecture in 2050",
    branches: [
      {
        id: 1,
        title: "Energy & Power Systems",
        subtopics: ["Solar-harvesting window glass", "Kinetic sidewalk grids", "Micro-wind building turbines"]
      },
      {
        id: 2,
        title: "Green & Bio-materials",
        subtopics: ["Mycelium insulation panels", "Self-healing bacterial concrete", "Algae filtration facades"]
      },
      {
        id: 3,
        title: "Water Management",
        subtopics: ["Greywater recycling bioswales", "Atmospheric water collectors", "Permeable sponge roads"]
      }
    ]
  });

  // States for Prompt Improver
  const [originalPrompt, setOriginalPrompt] = useState('write an email asking for a performance review');
  const [promptStyle, setPromptStyle] = useState('Professional');
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // States for Blueprint
  const [blueprintType, setBlueprintType] = useState<BlueprintType>('itinerary');
  const [blueprintPrompt, setBlueprintPrompt] = useState('3 days in Tokyo for tech enthusiasts');
  
  const [itineraryResult, setItineraryResult] = useState<ItineraryData | null>(null);
  const [characterResult, setCharacterResult] = useState<CharacterData | null>(null);
  const [quizResult, setQuizResult] = useState<QuizData | null>(null);

  // Quiz Interaction States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Packing list checklist states
  const [checkedPacking, setCheckedPacking] = useState<Record<string, boolean>>({});

  // Active day filter for Itinerary
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Mindmap
  const generateMindmap = async () => {
    if (!mindmapPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a mindmap brainstorm of branches and detailed subtopics for this topic: "${mindmapPrompt}"`,
          systemInstruction: 'You are an elite brainstormer and innovation consultant. Break down complex topics into creative, logical branches.',
          schema: {
            type: 'OBJECT',
            properties: {
              topic: { type: 'STRING', description: 'The main central topic.' },
              branches: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'INTEGER' },
                    title: { type: 'STRING', description: 'Branch title representing a core theme.' },
                    subtopics: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                      description: '3 highly specific innovative bullet points or suggestions for this branch.'
                    }
                  },
                  required: ['id', 'title', 'subtopics']
                }
              }
            },
            required: ['topic', 'branches']
          }
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to brainstorm mindmap.');
      setMindmapResult(resData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Improve Prompt
  const improvePrompt = async () => {
    if (!originalPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const systemInstruction = `You are an expert prompt engineer. Your job is to take a basic, weak user prompt and convert it into a highly effective, structured, role-based AI prompt. Use the specified style: "${promptStyle}". Add a clear persona, constraints, step-by-step instructions, and expected output format.`;
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Improve this raw prompt: "${originalPrompt}"`,
          systemInstruction,
          temperature: 0.7
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to improve prompt.');
      setImprovedPrompt(resData.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Blueprint
  const generateBlueprint = async () => {
    if (!blueprintPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setItineraryResult(null);
    setCharacterResult(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setCheckedPacking({});
    setActiveDayIdx(0);

    try {
      let schema: any;
      let systemInstruction = '';
      let prompt = '';

      if (blueprintType === 'itinerary') {
        prompt = `Generate a detailed structured itinerary for: "${blueprintPrompt}"`;
        systemInstruction = 'You are an experienced travel guide and master of planning itineraries. Build incredibly fun, logistically realistic schedules with tailored packing items.';
        schema = {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            destination: { type: 'STRING' },
            duration: { type: 'STRING' },
            packingList: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            schedule: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  day: { type: 'STRING', description: 'e.g. Day 1, Day 2' },
                  theme: { type: 'STRING', description: 'Overall theme of the day' },
                  activities: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        time: { type: 'STRING', description: 'e.g. 09:00 AM' },
                        activity: { type: 'STRING' },
                        location: { type: 'STRING', description: 'Specific location or venue' }
                      },
                      required: ['time', 'activity']
                    }
                  }
                },
                required: ['day', 'theme', 'activities']
              }
            }
          },
          required: ['title', 'destination', 'duration', 'packingList', 'schedule']
        };
      } else if (blueprintType === 'character') {
        prompt = `Generate an immersive RPG roleplay or story character concept based on: "${blueprintPrompt}"`;
        systemInstruction = 'You are a professional game designer and fantasy storyteller. Build vibrant, balanced characters with deep lore and strategic stats (out of 100).';
        schema = {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            class: { type: 'STRING', description: 'Combat archetype or fantasy class' },
            role: { type: 'STRING', description: 'Narrative or functional role' },
            attributes: {
              type: 'OBJECT',
              properties: {
                strength: { type: 'INTEGER', description: 'Physical power (1-100)' },
                dexterity: { type: 'INTEGER', description: 'Agility and speed (1-100)' },
                intelligence: { type: 'INTEGER', description: 'Cognition and magic (1-100)' },
                charisma: { type: 'INTEGER', description: 'Persuasion and leadership (1-100)' }
              },
              required: ['strength', 'dexterity', 'intelligence', 'charisma']
            },
            backstory: { type: 'STRING', description: 'Rich character lore, origin, and motivations (2-3 paragraphs)' },
            inventory: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: '3 legendary or signature items they carry'
            }
          },
          required: ['name', 'class', 'role', 'attributes', 'backstory', 'inventory']
        };
      } else {
        // Quiz
        prompt = `Generate a high-quality educational quiz with 4 multiple choice questions based on: "${blueprintPrompt}"`;
        systemInstruction = 'You are a veteran educator and educational content designer. Write thought-provoking questions, plausible distractors, and helpful constructive explanations.';
        schema = {
          type: 'OBJECT',
          properties: {
            quizTitle: { type: 'STRING' },
            description: { type: 'STRING' },
            questions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  questionText: { type: 'STRING' },
                  options: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  correctOptionIndex: { type: 'INTEGER', description: '0-based index of correct option' },
                  explanation: { type: 'STRING', description: 'Detailed explanation of why the answer is correct.' }
                },
                required: ['id', 'questionText', 'options', 'correctOptionIndex', 'explanation']
              }
            }
          },
          required: ['quizTitle', 'description', 'questions']
        };
      }

      const response = await fetch('/api/gemini/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction, schema, temperature: 0.8 })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to generate blueprint.');

      if (blueprintType === 'itinerary') {
        setItineraryResult(resData.data);
      } else if (blueprintType === 'character') {
        setCharacterResult(resData.data);
      } else {
        setQuizResult(resData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Creative AI Workspace</h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Gemini 3.5 Flash Active
              </p>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs max-w-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Credentials managed through AI Studio's <strong>Secrets</strong> panel.</span>
          </div>
        </div>
      </header>

      {/* Workspace App Layout */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Workspace Selectors */}
        <div className="flex flex-wrap border-b border-slate-200 mb-8 gap-2">
          <button
            onClick={() => { setActiveTab('mindmap'); setError(null); }}
            className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'mindmap'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <Lightbulb className="w-4.5 h-4.5" />
            Brainstorm Sandbox
          </button>
          <button
            onClick={() => { setActiveTab('prompt'); setError(null); }}
            className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'prompt'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <Wand2 className="w-4.5 h-4.5" />
            Prompt Smith
          </button>
          <button
            onClick={() => { setActiveTab('blueprint'); setError(null); }}
            className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'blueprint'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <ListChecks className="w-4.5 h-4.5" />
            Blueprint Generator
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-900 px-4 py-3 rounded-lg shadow-sm mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Error encountered:</span> {error}
            </div>
          </div>
        )}

        {/* ==================== WORKSPACE: MINDMAP BRAINSTORM ==================== */}
        {activeTab === 'mindmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Idea Brainstorming
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Generate logical structured branches with creative action points for any concept or trend instantly using Gemini.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                      Brainstorm Concept
                    </label>
                    <textarea
                      value={mindmapPrompt}
                      onChange={(e) => setMindmapPrompt(e.target.value)}
                      placeholder="e.g. Next-generation smart home wearable tech"
                      rows={3}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50/50"
                    />
                  </div>

                  <button
                    onClick={generateMindmap}
                    disabled={loading || !mindmapPrompt.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Spark...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Brainstorm Branches
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="bg-slate-100/70 rounded-xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Try standard topics
                </h4>
                <div className="flex flex-col gap-2">
                  {[
                    'Sustainable Urban Architecture in 2050',
                    'A post-apocalyptic Sci-Fi boardgame core mechanics',
                    'Zero-waste community cafe business model'
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setMindmapPrompt(topic)}
                      className="text-left text-xs bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg p-2.5 text-slate-700 transition-all font-medium truncate"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mindmap Canvas Display */}
            <div className="lg:col-span-8">
              {mindmapResult ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[450px] relative overflow-hidden flex flex-col">
                  {/* Central Hub Node */}
                  <div className="mx-auto bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-md text-center max-w-md border border-slate-800 tracking-wide z-10 transition-all hover:scale-105">
                    <span className="text-xs text-indigo-400 block uppercase font-black mb-0.5 tracking-wider">Concept Hub</span>
                    {mindmapResult.topic}
                  </div>

                  {/* Branches Layout */}
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 z-10">
                    {mindmapResult.branches.map((branch, idx) => {
                      // Decorative theme gradients for branches
                      const colors = [
                        { border: 'border-indigo-100', text: 'text-indigo-600', bg: 'bg-indigo-50/40' },
                        { border: 'border-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50/40' },
                        { border: 'border-pink-100', text: 'text-pink-600', bg: 'bg-pink-50/40' }
                      ];
                      const style = colors[idx % colors.length];

                      return (
                        <div
                          key={branch.id}
                          className={`flex flex-col border ${style.border} rounded-xl p-5 ${style.bg} hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`w-6 h-6 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center text-xs font-bold ${style.text}`}>
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm leading-snug">
                              {branch.title}
                            </h4>
                          </div>

                          <div className="space-y-2 flex-1">
                            {branch.subtopics.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="bg-white border border-slate-200/60 rounded-lg p-2.5 text-xs text-slate-600 font-medium leading-relaxed shadow-xs flex gap-2 items-start"
                              >
                                <span className={`text-[10px] font-bold ${style.text} mt-0.5 shrink-0`}>●</span>
                                <span>{sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aesthetic Background Grid Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 min-h-[450px]">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <Lightbulb className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg">Brainstorm Sandbox</h3>
                  <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
                    Type a topic on the left and trigger the AI brainstorm to generate a responsive mindmap branch tree.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== WORKSPACE: PROMPT SMITH ==================== */}
        {activeTab === 'prompt' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-600" />
                  AI Prompt Smith
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Turn flat, brief prompts into high-performance, structured templates with role play, strict instructions, and output constraints.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                      Raw/Weak Prompt
                    </label>
                    <textarea
                      value={originalPrompt}
                      onChange={(e) => setOriginalPrompt(e.target.value)}
                      placeholder="e.g. explain gravity to a kid"
                      rows={4}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">
                      Optimization Tone / Objective
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Creative', desc: 'Engaging, narrative, unique' },
                        { name: 'Professional', desc: 'Clear, authoritative, structured' },
                        { name: 'Socratic Explainer', desc: 'Educational, conceptual' },
                        { name: 'Software Spec', desc: 'Dry, code/API focused, logical' }
                      ].map((style) => (
                        <button
                          key={style.name}
                          onClick={() => setPromptStyle(style.name)}
                          className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                            promptStyle === style.name
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="font-bold block mb-0.5">{style.name}</div>
                          <span className="text-[10px] font-normal text-slate-400">{style.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={improvePrompt}
                disabled={loading || !originalPrompt.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Forging Prompt...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Improve & Forge Prompt
                  </>
                )}
              </button>
            </div>

            {/* Output Display */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[450px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Smith Output • {promptStyle}
                  </div>
                  {improvedPrompt && (
                    <button
                      onClick={() => handleCopy(improvedPrompt)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg p-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Prompt
                        </>
                      )}
                    </button>
                  )}
                </div>

                {improvedPrompt ? (
                  <div className="text-sm font-mono leading-relaxed overflow-y-auto max-h-[350px] whitespace-pre-wrap pr-2 text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {improvedPrompt}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-10 h-[300px]">
                    <div className="bg-slate-800 p-3 rounded-xl mb-3 text-slate-400">
                      <Wand2 className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                      Forged optimized prompt will appear here. Choose a style, enter a prompt on the left, and click run.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center justify-between">
                <span>Directly copyable to Google AI Studio, ChatGPT, or Claude</span>
                <span>SYSTEM INSTRUCTION MODE</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== WORKSPACE: BLUEPRINT GENERATOR ==================== */}
        {activeTab === 'blueprint' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sidebar Input Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-600" />
                  Blueprint Studio
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Leverage strict JSON schemas and system rules to construct dynamic, fully interactive client widgets.
                </p>

                <div className="space-y-4">
                  {/* Select Blueprint Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">
                      Blueprint Type
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'itinerary', label: 'Travel Itinerary Plan', icon: MapPin },
                        { id: 'character', label: 'Fantasy RPG Sheet', icon: Trophy },
                        { id: 'quiz', label: 'Interactive Concept Quiz', icon: BookOpen }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setBlueprintType(item.id as BlueprintType);
                              if (item.id === 'itinerary') setBlueprintPrompt('3 days in Tokyo for tech enthusiasts');
                              if (item.id === 'character') setBlueprintPrompt('Cyberpunk neural hacker named Orion');
                              if (item.id === 'quiz') setBlueprintPrompt('Basic TypeScript types and generics quiz');
                            }}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                              blueprintType === item.id
                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Prompt */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                      Describe Artifact
                    </label>
                    <textarea
                      value={blueprintPrompt}
                      onChange={(e) => setBlueprintPrompt(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50/50"
                    />
                  </div>

                  <button
                    onClick={generateBlueprint}
                    disabled={loading || !blueprintPrompt.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Schema...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Blueprint
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Display Widget Canvas */}
            <div className="lg:col-span-8">
              
              {/* ITINERARY BLUEPRINT VIEW */}
              {blueprintType === 'itinerary' && (
                <div className="min-h-[450px]">
                  {itineraryResult ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-wider">
                            Verified JSON Artifact
                          </span>
                          <h2 className="text-xl font-extrabold text-slate-900 mt-1">{itineraryResult.title}</h2>
                          <div className="flex items-center gap-3 text-slate-500 text-xs font-medium mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {itineraryResult.destination}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {itineraryResult.duration}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Day Switcher */}
                      <div className="flex flex-wrap gap-1.5">
                        {itineraryResult.schedule.map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveDayIdx(idx)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              activeDayIdx === idx
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>

                      {/* Main schedule layout */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Selected Day Activities */}
                        <div className="md:col-span-8 space-y-4">
                          <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-4">
                            <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Day Objective</h4>
                            <p className="text-sm font-semibold text-slate-800 mt-1">
                              {itineraryResult.schedule[activeDayIdx]?.theme}
                            </p>
                          </div>

                          <div className="relative border-l-2 border-slate-100 pl-4 space-y-4 ml-2">
                            {itineraryResult.schedule[activeDayIdx]?.activities.map((act, index) => (
                              <div key={index} className="relative group">
                                {/* Dot indicator */}
                                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-transform group-hover:scale-125"></div>
                                <div className="text-xs font-bold text-indigo-600">{act.time}</div>
                                <div className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{act.activity}</div>
                                {act.location && (
                                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {act.location}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Custom packing items toggle widget */}
                        <div className="md:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Backpack className="w-4 h-4 text-slate-500" />
                              Carry Checklist
                            </h4>
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {itineraryResult.packingList.map((item, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCheckedPacking(prev => ({ ...prev, [item]: !prev[item] }))}
                                  className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-white rounded-lg transition-all"
                                >
                                  <span className={`w-4 h-4 border rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                    checkedPacking[item] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'
                                  }`}>
                                    {checkedPacking[item] && <Check className="w-3 h-3 stroke-[3]" />}
                                  </span>
                                  <span className={`text-xs font-medium leading-tight ${checkedPacking[item] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {item}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 border-t border-slate-200/80 pt-3 mt-4 text-center">
                            {Object.values(checkedPacking).filter(Boolean).length} / {itineraryResult.packingList.length} packed
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 h-full min-h-[450px]">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <MapPin className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg">Travel Plan Studio</h3>
                      <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
                        Generate structured itineraries with live checkbox packing logs. e.g. "3 Days in Kyoto for art lovers".
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* RPG CHARACTER BLUEPRINT VIEW */}
              {blueprintType === 'character' && (
                <div className="min-h-[450px]">
                  {characterResult ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-wider">
                          Verified JSON Character Artifact
                        </span>
                        <div className="flex justify-between items-start mt-2">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-wide">{characterResult.name}</h2>
                            <p className="text-xs font-bold text-amber-600 mt-0.5">{characterResult.class} • {characterResult.role}</p>
                          </div>
                          <div className="bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                            <Dices className="w-3.5 h-3.5" /> Character Level 1
                          </div>
                        </div>
                      </div>

                      {/* Attributes & Lore */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left column: Lore backstory */}
                        <div className="md:col-span-7 space-y-4">
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Backstory & Codex</h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                              {characterResult.backstory}
                            </p>
                          </div>

                          {/* Item inventory */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              Signature Inventory Equipment
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {characterResult.inventory.map((item, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 text-center shadow-xs">
                                  <span className="text-xs block font-bold text-slate-700 truncate" title={item}>{item}</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5 uppercase tracking-wide">Signature</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right column: Progress statistics */}
                        <div className="md:col-span-5 bg-slate-900 text-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <BarChart2 className="w-4 h-4 text-indigo-400" /> Core RPG Stats
                            </h4>
                            
                            <div className="space-y-3.5">
                              {[
                                { name: 'Strength', val: characterResult.attributes.strength, color: 'bg-rose-500' },
                                { name: 'Dexterity', val: characterResult.attributes.dexterity, color: 'bg-amber-500' },
                                { name: 'Intelligence', val: characterResult.attributes.intelligence, color: 'bg-indigo-500' },
                                { name: 'Charisma', val: characterResult.attributes.charisma, color: 'bg-emerald-500' }
                              ].map((stat) => (
                                <div key={stat.name} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-300">
                                    <span>{stat.name}</span>
                                    <span>{stat.val} / 100</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div className={`${stat.color} h-full transition-all duration-1000`} style={{ width: `${stat.val}%` }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3 mt-4 text-center flex justify-between items-center">
                            <span>Balance Score: Optimal</span>
                            <span>GEMINI CODEGEN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 h-full min-h-[450px]">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Dices className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg">Character Codex</h3>
                      <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
                        Design detailed story personas with balanced stat bars. e.g. "Space Smuggler named Jax".
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* INTERACTIVE SELF-GRADING QUIZ VIEW */}
              {blueprintType === 'quiz' && (
                <div className="min-h-[450px]">
                  {quizResult ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider">
                          Verified JSON Educational Artifact
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-2">{quizResult.quizTitle}</h2>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{quizResult.description}</p>
                      </div>

                      {/* Question lists */}
                      <div className="space-y-6">
                        {quizResult.questions.map((q, idx) => {
                          const isAnswered = selectedAnswers[q.id] !== undefined;
                          const selectedIdx = selectedAnswers[q.id];
                          const isCorrect = selectedIdx === q.correctOptionIndex;

                          return (
                            <div key={q.id} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-3.5">
                              <h4 className="font-bold text-slate-800 text-sm leading-snug">
                                <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 text-xs rounded mr-2 inline-block">Q{idx + 1}</span>
                                {q.questionText}
                              </h4>

                              {/* Options */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selectedIdx === oIdx;
                                  let optionClass = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';

                                  if (submittedQuiz) {
                                    if (oIdx === q.correctOptionIndex) {
                                      optionClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                                    } else if (isSelected) {
                                      optionClass = 'border-rose-400 bg-rose-50 text-rose-900';
                                    } else {
                                      optionClass = 'border-slate-200 opacity-60 bg-white text-slate-400';
                                    }
                                  } else if (isSelected) {
                                    optionClass = 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-semibold';
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={submittedQuiz}
                                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                      className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optionClass}`}
                                    >
                                      <span>{opt}</span>
                                      {submittedQuiz && oIdx === q.correctOptionIndex && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Grading feedback details */}
                              {submittedQuiz && (
                                <div className={`text-xs p-3 rounded-lg flex gap-2 items-start ${
                                  isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}>
                                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">{isCorrect ? 'Correct Answer!' : 'Incorrect.'}</span> {q.explanation}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Grading submission block */}
                      <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                        {submittedQuiz ? (
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 text-indigo-700 rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-indigo-600" />
                              Final Score: {
                                quizResult.questions.filter(q => selectedAnswers[q.id] === q.correctOptionIndex).length
                              } / {quizResult.questions.length} Correct
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAnswers({});
                                setSubmittedQuiz(false);
                              }}
                              className="text-slate-500 hover:text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-4 h-4" /> Reset Quiz
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSubmittedQuiz(true)}
                            disabled={Object.keys(selectedAnswers).length < quizResult.questions.length}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm transition-all disabled:opacity-50"
                          >
                            Grade Quiz & Review Answers
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 h-full min-h-[450px]">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg">Interactive Quiz Center</h3>
                      <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
                        Design educational tests with automated grading and explanations. e.g. "Basic TypeScript Generics Quiz".
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-16 text-center text-xs text-slate-400 font-medium">
        <div>Designed in Google AI Studio • Runs entirely on server-side sandboxed microservices</div>
      </footer>
    </div>
  );
}
