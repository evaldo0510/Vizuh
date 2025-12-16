import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Sparkles, User, Briefcase, 
  ShoppingBag, ChevronRight, Play, CheckCircle, Lock, 
  Menu, X, TrendingUp, ScanFace, ArrowRight, Download,
  MapPin, Aperture, Eye, Unlock, Crown, Check, ShieldCheck, Dumbbell, 
  Wand2, Image as ImageIcon, Loader2, Undo, Redo, Save, Share2, Clock,
  Layout, Sun, Monitor, Sofa, Grid3X3, Lightbulb, MessageSquare,
  Filter, ArrowUpDown, SlidersHorizontal, Calendar
} from 'lucide-react';
import { analyzeUserImage, generateFashionLook, editFashionLook, generateLayoutSuggestion, AnalysisResult, LayoutResult } from './services/geminiService';

/**
 * VIZUHALIZANDO - AI Image Consultant & Spaces App
 * * Versão: 8.8 - Smart Wardrobe & UI Polish
 */

// --- Tipos & Interfaces ---

type ViewState = 
  | 'onboarding' 
  | 'upload' 
  | 'analyzing' 
  | 'paywall'
  | 'pricing'
  | 'dashboard' 
  | 'look-generator' 
  | 'look-result'
  | 'wardrobe-grid'
  | 'education' 
  | 'professional'
  | 'layout-generator';

type PlanTier = 'free' | 'pro_monthly' | 'pro_annual' | 'studio_basic' | 'studio_pro' | 'studio_elite';
type ImageResolution = '1K' | '2K' | '4K';
type EditStyle = 'photorealistic' | 'cinematic' | 'sketch';

interface UserProfile extends Partial<AnalysisResult> {
  name: string;
  image: string | null;
  analyzed: boolean;
}

interface GeneratedLookData {
  id: string;
  objective: string;
  titulo: string;
  detalhes: string;
  environment?: string;
  environmentDesc?: string;
  motivo: string;
  items: string[];
  tips: string;
  imagePlaceholder: string;
  createdWithEnvironment: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: 'education' | 'tool' | 'edit' | null;
  data: any | null;
}

// --- Constantes de UX (Loading) ---
const LOADING_MESSAGES = [
  "Conectando ao estúdio criativo...",
  "Analisando tendências atuais...",
  "Selecionando tecidos e texturas...",
  "Harmonizando paleta de cores...",
  "Ajustando a iluminação virtual...",
  "Renderizando detalhes em alta resolução...",
  "Finalizando sua produção de moda..."
];

const LAYOUT_LOADING_MESSAGES = [
  "Analisando dimensões e briefing...",
  "Desenhando zonas de atividade...",
  "Posicionando mobiliário principal...",
  "Aplicando preferências de estilo...",
  "Finalizando conceito arquitetônico..."
];

const STYLE_TIPS = [
  "Dica: Cores análogas (vizinhas no círculo cromático) criam looks elegantes e alongam a silhueta.",
  "Sabia? A 'terceira peça' (como um blazer ou colete) é o segredo para transformar um look básico.",
  "Dica: Acessórios dourados costumam favorecer peles com subtom quente, enquanto prateados realçam as frias.",
  "Estilo: Looks monocromáticos não são chatos! Brinque com diferentes texturas da mesma cor.",
  "Dica: O contraste pessoal define o quão intensas suas estampas podem ser sem 'apagar' seu rosto."
];

// --- Dados dos Planos ---
const PLANS = {
  personal: [
    {
      id: 'free',
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      features: ['Análise de Rosto Básica', '1 Look gerado por mês', 'Paleta simplificada'],
      cta: 'Plano Atual',
      highlight: false,
      tier: 'free'
    },
    {
      id: 'pro_monthly',
      name: 'Pro Pessoal',
      price: 'R$ 29,90',
      period: '/mês',
      features: ['Análise Completa (Gemini 2.5)', 'Geração em HD', 'Editor Mágico (Flash)', 'Colorimetria Avançada'],
      cta: 'Começar 7 dias grátis',
      highlight: true,
      tier: 'pro_monthly'
    },
    {
      id: 'pro_annual',
      name: 'Anual Pessoal',
      price: 'R$ 19,90',
      period: '/mês*',
      subtext: '*Cobrado anualmente (R$ 238,80)',
      features: ['Tudo do Pro Pessoal', 'Economia de 33%', 'Acesso antecipado a features'],
      cta: 'Assinar com Desconto',
      highlight: false,
      tier: 'pro_annual'
    }
  ],
  professional: [
    {
      id: 'studio_basic',
      name: 'Studio Básico',
      price: 'R$ 89,90',
      period: '/mês',
      features: ['Até 10 clientes/mês', 'Ficha técnica básica', 'Painel de Gestão'],
      cta: 'Assinar Básico',
      highlight: false,
      tier: 'studio_basic'
    },
    {
      id: 'studio_pro',
      name: 'Studio Pro',
      price: 'R$ 149,90',
      period: '/mês',
      features: ['Clientes Ilimitados', 'Dossiê em PDF (White-label)', 'Comparador de Tecidos', 'Suporte Prioritário'],
      cta: 'Assinar Pro',
      highlight: true,
      tier: 'studio_pro'
    },
    {
      id: 'studio_elite',
      name: 'Studio Elite',
      price: 'R$ 299,90',
      period: '/mês',
      features: ['Tudo do Studio Pro', 'API de Integração', 'Treinamento de Equipe', 'Multi-usuários (3 seats)'],
      cta: 'Falar com Vendas',
      highlight: false,
      tier: 'studio_elite'
    }
  ]
};

const SEASONS: Record<string, { colors: string[], description: string, icon: string }> = {
  'Inverno Brilhante': { 
    colors: ['#000000', '#FFFFFF', '#E60026', '#1F3A93', '#8E44AD'], 
    description: 'Cores frias, intensas e puras. Alto contraste é sua marca.',
    icon: '❄️'
  },
  'Verão Suave': { 
    colors: ['#7B8CA3', '#ECECEE', '#9EA8C9', '#D98E96', '#A094B7'], 
    description: 'Cores frias, suaves e opacas. Elegância discreta e fluida.',
    icon: '☀️'
  },
  'Outono Profundo': { 
    colors: ['#4B2E1E', '#D4AF37', '#9E3C28', '#2E523A', '#6D2121'], 
    description: 'Cores quentes, escuras e terrosas. Sofisticação natural.',
    icon: '🍂'
  },
  'Primavera Clara': { 
    colors: ['#FEF5E7', '#F4D03F', '#F39C12', '#7DCEA0', '#3498DB'], 
    description: 'Cores quentes, claras e vibrantes. Energia e acessibilidade.',
    icon: '🌸'
  },
};

const EDUCATIONAL_TRACKS = [
  { id: 1, title: 'Jornada das Cores', subtitle: 'Descubra o poder da sua cartela', days: 30, progress: 15, locked: false, color: 'bg-purple-100 text-purple-700', content: 'Conteúdo da aula...' },
  { id: 2, title: 'Guarda-roupa Cápsula', subtitle: 'Minimalismo estratégico', days: 14, progress: 0, locked: false, color: 'bg-orange-100 text-orange-700', content: 'Conteúdo da aula...' },
  { id: 3, title: 'Imagem de Liderança', subtitle: 'Comunique autoridade', days: 7, progress: 0, locked: false, color: 'bg-blue-100 text-blue-700', content: 'Conteúdo da aula...' },
];

const LOOK_OBJECTIVES = [
  { id: 'work', label: 'Corporativo', icon: Briefcase, desc: 'Autoridade profissional', environmentContext: 'Modern office with glass walls' },
  { id: 'casual', label: 'Casual Dia', icon: User, desc: 'Estilo no dia a dia', environmentContext: 'Urban coffee shop outdoor seating' },
  { id: 'party', label: 'Festa / Noite', icon: Sparkles, desc: 'Noite e sofisticação', environmentContext: 'Sophisticated rooftop lounge at night' },
  { id: 'sport', label: 'Esportivo', icon: Dumbbell, desc: 'Performance com estilo', environmentContext: 'High-end gym or city park' },
];

// --- Componentes UI Reutilizáveis ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, ...props }: any) => {
  const baseStyle = "flex items-center justify-center px-6 py-3.5 rounded-xl font-medium transition-all duration-300 transform active:scale-95 shadow-sm select-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    gradient: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 hover:shadow-xl",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 shadow-none",
    glass: "bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30",
    premium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

// --- Componente AutoLayoutGenerator (Nova Feature) ---
const AutoLayoutGenerator = ({ onBack }: { onBack: () => void }) => {
  const [roomType, setRoomType] = useState('Sala de Estar');
  const [width, setWidth] = useState(4);
  const [length, setLength] = useState(5);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [customPreference, setCustomPreference] = useState('');
  const [result, setResult] = useState<LayoutResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const availablePreferences = [
    { id: 'luz_natural', label: 'Priorizar Luz Natural', icon: Sun },
    { id: 'home_office', label: 'Espaço Home Office', icon: Monitor },
    { id: 'circulacao', label: 'Circulação Ampla', icon: ArrowRight },
    { id: 'social', label: 'Foco Social/Receber', icon: User },
    { id: 'armazenamento', label: 'Muito Armazenamento', icon: Grid3X3 },
    { id: 'leitura', label: 'Canto de Leitura', icon: Sofa },
  ];

  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const allPrefs = [...preferences];
      if (customPreference.trim()) {
        allPrefs.push(customPreference.trim());
      }
      
      const layout = await generateLayoutSuggestion(roomType, width, length, allPrefs);
      setResult(layout);
    } catch (e) {
      alert("Erro ao gerar layout. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="p-6 bg-white shadow-sm flex items-center border-b border-slate-100">
        <button onClick={onBack} className="mr-4"><ArrowRight className="w-6 h-6 rotate-180" /></button>
        <div>
          <h2 className="text-xl font-serif text-slate-900">Arquiteto IA</h2>
          <p className="text-xs text-slate-500">AutoLayout com Gemini 2.5 Flash</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!result ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-violet-600"/> Dimensões & Tipo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cômodo</label>
                  <select 
                    value={roomType} 
                    onChange={e => setRoomType(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                  >
                    <option>Sala de Estar</option>
                    <option>Quarto de Casal</option>
                    <option>Home Office</option>
                    <option>Cozinha</option>
                    <option>Varanda</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Largura (m)</label>
                    <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Comprimento (m)</label>
                    <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500"/> Preferências
              </h3>
              <p className="text-sm text-slate-500 mb-4">O que é essencial para este ambiente?</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {availablePreferences.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => togglePreference(pref.label)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${preferences.includes(pref.label) ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm' : 'border-slate-100 hover:bg-slate-50 text-slate-600'}`}
                  >
                    <pref.icon className={`w-6 h-6 ${preferences.includes(pref.label) ? 'text-violet-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">{pref.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Outras Observações (Opcional)</label>
                <input 
                  type="text" 
                  value={customPreference}
                  onChange={(e) => setCustomPreference(e.target.value)}
                  placeholder="Ex: Tenho um piano vertical, gosto de plantas..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </section>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-4 text-lg">
              {isGenerating ? <><Loader2 className="animate-spin mr-2"/> Criando Projeto...</> : 'Gerar Layout'}
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
             <div className="bg-violet-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Conceito do Projeto</h3>
                  <h2 className="text-3xl font-serif mb-4">{result.conceptName}</h2>
                  <p className="text-violet-100 text-lg leading-relaxed">{result.spatialStrategy}</p>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                {result.zones.map((zone, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-violet-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-lg">{zone.name}</h4>
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{zone.placement}</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{zone.description}</p>
                    <div className="flex flex-wrap gap-2">
                       {zone.items.map((item, i) => (
                         <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded font-medium">{item}</span>
                       ))}
                    </div>
                  </div>
                ))}
             </div>

             <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                <Lightbulb className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div>
                   <h4 className="font-bold text-amber-900 mb-1">Estratégia de Iluminação</h4>
                   <p className="text-amber-800/80 text-sm">{result.lightingTips}</p>
                </div>
             </div>

             <Button variant="secondary" onClick={() => setResult(null)} className="w-full">
               Criar Novo Layout
             </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componente PricingView ---
const PricingView = ({ onSelectPlan, currentPlan, onBack }: { onSelectPlan: (plan: PlanTier) => void, currentPlan: PlanTier, onBack: () => void }) => {
  const [tab, setTab] = useState<'personal' | 'professional'>('personal');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      <div className="bg-slate-900 text-white p-8 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="text-center mt-6 relative z-10">
          <h2 className="text-3xl font-serif mb-2">Escolha seu Plano</h2>
          <p className="text-slate-300 text-sm max-w-xs mx-auto">
            Desbloqueie todo o potencial da sua imagem com nossa IA avançada.
          </p>
        </div>

        <div className="flex justify-center mt-8 relative z-10">
          <div className="bg-slate-800 p-1 rounded-full flex">
            <button 
              onClick={() => setTab('personal')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${tab === 'personal' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Para Você
            </button>
            <button 
              onClick={() => setTab('professional')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${tab === 'professional' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Profissional
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-8 space-y-4 overflow-y-auto pt-4 pb-8">
        {PLANS[tab].map((plan) => (
          <div 
            key={plan.id} 
            className={`bg-white rounded-2xl p-6 border-2 transition-all relative ${plan.highlight ? 'border-violet-500 shadow-xl shadow-violet-100 scale-105 z-10' : 'border-transparent shadow-md opacity-90'}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                {plan.tier === currentPlan && <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded">Atual</span>}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900 block">{plan.price}</span>
                <span className="text-xs text-slate-500">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-slate-600">
                  <Check className="w-4 h-4 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {'subtext' in plan && (
              <p className="text-xs text-slate-400 text-center mb-3">{(plan as any).subtext}</p>
            )}

            <Button 
              variant={plan.highlight ? 'gradient' : 'secondary'} 
              className="w-full text-sm py-3"
              onClick={() => onSelectPlan(plan.tier as PlanTier)}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Componente PaywallView ---
const PaywallView = ({ onUnlock }: { onUnlock: () => void }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 z-10"></div>
      <div className="relative z-20 px-8 text-center max-w-md w-full animate-in slide-in-from-bottom duration-700">
        <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/50">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-serif text-white mb-3">Análise Pronta!</h1>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          Nossa IA (Gemini 2.5 Flash) processou seus traços. Desbloqueie o resultado.
        </p>

        <Button 
          variant="premium" 
          onClick={onUnlock} 
          className="w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/20 mb-4"
        >
          Desbloquear <span className="text-[10px] ml-2 font-normal opacity-90">(7 dias grátis)</span>
        </Button>
      </div>
    </div>
  );
};

// --- Componente WardrobeGridView (Enhanced) ---
const WardrobeGridView = ({ looks, onBack, onViewDetail }: { looks: GeneratedLookData[], onBack: () => void, onViewDetail: (look: GeneratedLookData) => void }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Logic to sort and filter looks
  const filteredLooks = looks
    .filter(look => activeCategory === 'all' || look.objective === activeCategory)
    .sort((a, b) => {
        // Assuming ID contains timestamp or we sort by simple string comparison for this demo
        // For robustness in real app, add a createdAt timestamp.
        // ID format: gen-123123123
        const timeA = parseInt(a.id.split('-')[1]) || 0;
        const timeB = parseInt(b.id.split('-')[1]) || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const categories = [
    { id: 'all', label: 'Todos' },
    ...LOOK_OBJECTIVES.map(obj => ({ id: obj.id, label: obj.label }))
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white shadow-sm z-10 sticky top-0">
        <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180" /></button>
                    <div>
                        <h2 className="text-2xl font-serif text-slate-900">Guarda-Roupa</h2>
                        <p className="text-xs text-slate-500">{looks.length} looks gerados</p>
                    </div>
                </div>
                <button 
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-colors flex items-center gap-2 px-4 border border-slate-200"
                >
                    <span className="text-xs font-bold hidden sm:inline">{sortOrder === 'newest' ? 'Recentes' : 'Antigos'}</span>
                    <ArrowUpDown className="w-4 h-4" />
                </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            activeCategory === cat.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
        {filteredLooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-20 animate-in fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-sm font-medium">Nenhum look encontrado nesta categoria.</p>
            <button onClick={() => setActiveCategory('all')} className="mt-4 text-violet-600 text-xs font-bold hover:underline">
                Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 auto-rows-fr animate-in slide-in-from-bottom-4 duration-500">
            {filteredLooks.map((look) => (
              <div 
                key={look.id} 
                onClick={() => onViewDetail(look)}
                className="relative aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-slate-100"
              >
                <img 
                  src={look.imagePlaceholder} 
                  alt={look.titulo} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white text-xs font-bold uppercase tracking-wider mb-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded w-fit">
                    {look.titulo}
                  </span>
                  <div className="flex items-center text-white/80 text-[10px] gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(parseInt(look.id.split('-')[1]) || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componente Principal ---

const VizuhalizandoApp = () => {
  const [view, setView] = useState<ViewState>('onboarding');
  const [userPlan, setUserPlan] = useState<PlanTier>('free');
  const [user, setUser] = useState<UserProfile>({
    name: 'Visitante',
    image: null,
    analyzed: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  // Loading UX States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const [selectedResolution, setSelectedResolution] = useState<ImageResolution>('1K');
  const [generatedLook, setGeneratedLook] = useState<GeneratedLookData | null>(null);
  const [generatedWardrobe, setGeneratedWardrobe] = useState<GeneratedLookData[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [createEnvironment, setCreateEnvironment] = useState(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, data: null });
  
  // Edit State
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedEditStyle, setSelectedEditStyle] = useState<EditStyle>('photorealistic');

  const openModal = (type: 'education' | 'tool' | 'edit', data: any) => setModal({ isOpen: true, type, data });
  const closeModal = () => setModal({ isOpen: false, type: null, data: null });

  // Handle Loading UX Animation
  useEffect(() => {
    if (isProcessing) {
      setLoadingProgress(0);
      const startTime = Date.now();
      const estimatedDuration = 25000; // 25s target
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Logarithmic slowdown progress curve
        const progress = Math.min(98, (1 - Math.exp(-elapsed / 10000)) * 100);
        setLoadingProgress(progress);
        
        // Cycle messages based on progress
        const messagesToUse = view === 'layout-generator' ? LAYOUT_LOADING_MESSAGES : LOADING_MESSAGES;
        const msgIndex = Math.min(messagesToUse.length - 1, Math.floor((elapsed / estimatedDuration) * messagesToUse.length));
        setProcessingStep(messagesToUse[msgIndex]);

      }, 100);

      // Cycle tips every 6 seconds
      const tipInterval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % STYLE_TIPS.length);
      }, 6000);

      return () => {
        clearInterval(interval);
        clearInterval(tipInterval);
      };
    }
  }, [isProcessing, view]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, image: reader.result as string }));
        setView('analyzing');
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform Analysis with Gemini 2.5 Flash (Fast)
  useEffect(() => {
    if (view === 'analyzing' && user.image && !user.analyzed) {
      const performAnalysis = async () => {
        setIsProcessing(true);
        // setProcessingStep handled by useEffect now
        
        try {
          // Real API Call
          const analysis = await analyzeUserImage(user.image!);
          
          setUser(prev => ({
            ...prev,
            analyzed: true,
            ...analysis
          }));
          
          setIsProcessing(false);
          if (userPlan === 'free') {
            setView('paywall');
          } else {
            setView('dashboard');
          }
        } catch (error) {
          console.error("Analysis failed", error);
          setProcessingStep('Erro na análise. Tentando novamente...');
          setTimeout(() => setView('upload'), 2000);
        }
      };

      performAnalysis();
    }
  }, [view, user.image, userPlan]);

  const handlePlanSelection = (plan: PlanTier) => {
    setUserPlan(plan);
    setTimeout(() => {
      setView('dashboard');
    }, 500);
  };

  // Generate Look with Gemini 2.5 Flash Image
  const generateLook = async (objectiveId: string) => {
    setIsProcessing(true);
    const objectiveData = LOOK_OBJECTIVES.find(o => o.id === objectiveId);
    
    try {
      // Prompt construction
      const prompt = `A fashionable person with ${user.skinTone} skin tone and ${user.season} color palette, wearing a ${objectiveData?.label} outfit consisting of harmonious items. ${createEnvironment ? `Context: ${objectiveData?.environmentContext}` : 'Simple background'}.`;
      
      const imageUrl = await generateFashionLook(prompt, selectedResolution);

      setGeneratedLook({
        id: `gen-${Date.now()}`,
        objective: objectiveId,
        titulo: objectiveData?.label || 'Look',
        environment: objectiveData?.environmentContext,
        environmentDesc: createEnvironment ? 'Ambiente realista.' : 'Fundo original.',
        items: ['Peça Principal', 'Peça Secundária'], 
        detalhes: 'Look gerado por IA.',
        tips: 'Dica de estilo.',
        imagePlaceholder: imageUrl,
        createdWithEnvironment: createEnvironment,
        motivo: 'Harmonia de cores'
      });
      
      // Init history
      setEditHistory([imageUrl]);
      setHistoryIndex(0);
      
      setIsProcessing(false);
      setView('look-result');
    } catch (e) {
      console.error(e);
      setProcessingStep('Erro na geração. Verifique sua chave API.');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  // Edit Look with Gemini 2.5 Flash Image
  const handleEditLook = async () => {
    if (!generatedLook || !editPrompt) return;
    setIsEditing(true);
    try {
      const styleInstruction = selectedEditStyle === 'photorealistic' ? 'Photorealistic style' : 
                               selectedEditStyle === 'cinematic' ? 'Cinematic lighting and composition' : 
                               'Fashion sketch style, artistic illustration';
      
      const finalPrompt = `${editPrompt}. ${styleInstruction}.`;
      const newImage = await editFashionLook(generatedLook.imagePlaceholder, finalPrompt);
      
      // Update history
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(newImage);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setGeneratedLook(prev => prev ? ({ ...prev, imagePlaceholder: newImage }) : null);
      setEditPrompt('');
      closeModal();
    } catch (e) {
      console.error(e);
      alert("Erro ao editar imagem");
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGeneratedLook(prev => prev ? ({ ...prev, imagePlaceholder: editHistory[newIndex] }) : null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGeneratedLook(prev => prev ? ({ ...prev, imagePlaceholder: editHistory[newIndex] }) : null);
    }
  };
  
  const saveToWardrobe = () => {
    if (generatedLook) {
      // Check if already exists by ID? Since ID is time based, we check if title matches roughly or just append
      // Let's just append but give feedback
      setGeneratedWardrobe(prev => [...prev, { ...generatedLook, id: `${generatedLook.id}-saved-${Date.now()}` }]);
      alert("Look salvo no guarda-roupa!");
    }
  };

  const handleShare = async () => {
    if (!generatedLook) return;
    try {
      await navigator.share({
        title: `Meu Look Vizuhalizando: ${generatedLook.titulo}`,
        text: `Confira este look gerado por IA: ${generatedLook.titulo}. ${generatedLook.detalhes}`,
        url: window.location.href
      });
    } catch (err) {
      // Fallback
      alert("Compartilhamento não suportado neste navegador ou cancelado.");
    }
  };

  // --- Views ---

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#FDFBF7]"></div>
        </div>
        
        <div className="flex-1 flex flex-col justify-end p-8 z-10">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold tracking-wide mb-4 border border-violet-200 shadow-sm">
              POWERED BY GEMINI 2.5 FLASH
            </span>
            <h1 className="text-5xl font-serif text-slate-900 leading-tight mb-4">
              Seu estilo,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 italic">decodificado.</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed max-w-md">
              Descubra suas cores e experimente looks com IA Generativa.
            </p>
          </div>

          <div className="space-y-4">
            <Button variant="primary" onClick={() => setView('upload')} className="w-full text-lg shadow-xl shadow-violet-200">
              Começar Análise
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'upload') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6">
        <div className="flex items-center mb-8">
          <button onClick={() => setView('onboarding')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowRight className="w-6 h-6 rotate-180 text-slate-600" />
          </button>
          <div className="w-full h-2 bg-slate-100 rounded-full ml-4 overflow-hidden">
            <div className="w-1/3 h-full bg-violet-600"></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ScanFace className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-serif text-slate-900 mb-3">Vamos conhecer você</h2>
          <p className="text-slate-500 mb-8 max-w-xs">
            Envie sua foto para que o <strong>Gemini 2.5 Flash</strong> analise seu rosto.
          </p>

          <label className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition-all group relative overflow-hidden bg-slate-50">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            {user.image ? (
              <img src={user.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            ) : (
              <>
                <Camera className="w-12 h-12 text-slate-300 group-hover:text-violet-500 mb-4 transition-colors" />
                <span className="text-slate-500 font-medium group-hover:text-violet-700">Tirar selfie ou escolher</span>
              </>
            )}
          </label>
        </div>
      </div>
    );
  }

  if (view === 'analyzing' || (view === 'look-generator' && isProcessing)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
          <div className="w-32 h-32 relative mb-8">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-violet-500 rounded-full border-l-transparent border-r-transparent animate-spin"
              style={{ animationDuration: '3s' }}
            ></div>
            {user.image && (
              <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-slate-800">
                <img src={user.image} className="w-full h-full object-cover opacity-80" />
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-serif text-white mb-2">
            {view === 'analyzing' ? 'Analisando Traços' : 'Gerando Visual'}
          </h3>
          
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-4 overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ease-out"
               style={{ width: `${loadingProgress}%` }}
             ></div>
          </div>

          <p className="text-violet-300 text-sm font-medium tracking-wide h-6 mb-8 transition-all duration-500">
            {processingStep}
          </p>

          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 text-amber-400" />
               <span className="text-xs font-bold text-slate-300 uppercase">Dica de Estilo</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed italic">
              "{STYLE_TIPS[currentTipIndex]}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'paywall') return <PaywallView onUnlock={() => setView('pricing')} />;
  if (view === 'pricing') return <PricingView onSelectPlan={handlePlanSelection} currentPlan={userPlan} onBack={() => setView('paywall')} />;
  
  if (view === 'wardrobe-grid') {
    return (
      <WardrobeGridView 
        looks={generatedWardrobe} 
        onBack={() => setView('dashboard')} 
        onViewDetail={(look) => {
          setGeneratedLook(look);
          // Set history to just this image since we are loading it fresh
          setEditHistory([look.imagePlaceholder]);
          setHistoryIndex(0);
          setView('look-result');
        }}
      />
    );
  }

  if (view === 'layout-generator') {
    return <AutoLayoutGenerator onBack={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col pb-24 relative">
        <header className="px-6 pt-12 pb-6 bg-white shadow-sm rounded-b-3xl z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-200">
                {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <User />}
              </div>
              <div>
                <h1 className="text-xl font-serif text-slate-900">Olá, {user.name}</h1>
                <div className="flex items-center">
                   <p className="text-xs text-violet-600 font-medium tracking-wide uppercase mr-2">
                     {user.season || 'Análise Pendente'}
                   </p>
                   {userPlan !== 'free' && <Crown className="w-3 h-3 text-amber-500" />}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setView('wardrobe-grid')} 
              className="p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-slate-100 relative"
            >
               <ShoppingBag className="w-6 h-6" />
               <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl shadow-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Visagismo</p>
                <h2 className="text-2xl font-serif">{user.faceShape || '...'}</h2>
              </div>
              <span className="text-3xl">{user.season && SEASONS[user.season!]?.icon}</span>
            </div>
            <div className="flex gap-2">
              {user.season && SEASONS[user.season!]?.colors.map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-800" style={{ backgroundColor: c }}></div>
              ))}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8 overflow-y-auto">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Gerador Gemini</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setView('look-generator')}
                className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
              >
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center p-4">
                  <h4 className="text-white font-serif text-lg leading-tight">Looks de Moda</h4>
                  <div className="flex items-center text-[10px] text-slate-300 mt-2">
                     <ImageIcon className="w-3 h-3 mr-1" />
                     HD Quality
                  </div>
                </div>
              </div>

              {/* Novo Botão para Layout Generator */}
              <div 
                onClick={() => setView('layout-generator')}
                className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
              >
                <img 
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 to-transparent flex flex-col justify-center p-4">
                  <h4 className="text-white font-serif text-lg leading-tight">Arquiteto IA</h4>
                  <div className="flex items-center text-[10px] text-violet-200 mt-2">
                     <Layout className="w-3 h-3 mr-1" />
                     Novo: Layouts
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Suas Trilhas</h3>
            </div>
            <div className="space-y-3">
              {EDUCATIONAL_TRACKS.map(track => (
                <div 
                  key={track.id} 
                  onClick={() => openModal('education', track)}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center cursor-pointer hover:border-violet-300 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${track.color}`}>
                     <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                       <h4 className="font-medium text-slate-900">{track.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{track.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Modal for Education */}
        {modal.isOpen && modal.type === 'education' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 relative">
              <button onClick={closeModal} className="absolute top-4 right-4"><X /></button>
              <h3 className="text-2xl font-serif mb-4">{modal.data?.title}</h3>
              <p>{modal.data?.content}</p>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40">
          <button className="flex flex-col items-center text-violet-600">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Perfil</span>
          </button>
          <button onClick={() => setView('look-generator')} className="flex flex-col items-center -mt-8">
            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-lg text-white ring-4 ring-slate-50">
              <ScanFace className="w-7 h-7" />
            </div>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Pro</span>
          </button>
        </nav>
      </div>
    );
  }

  if (view === 'look-generator' && !isProcessing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center bg-white shadow-sm z-10 sticky top-0">
          <button onClick={() => setView('dashboard')} className="mr-4 p-2 hover:bg-slate-100 rounded-full"><ArrowRight className="w-6 h-6 rotate-180" /></button>
          <div>
            <h2 className="text-xl font-serif text-slate-900">Gerador de Looks</h2>
            <p className="text-xs text-slate-500">Gemini 2.5 Flash Image</p>
          </div>
        </div>
        
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          
          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                    <label className="text-xs font-bold uppercase text-slate-500">Qualidade de Render</label>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setSelectedResolution(res)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${selectedResolution === res ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                 <div className="flex items-center justify-between cursor-pointer" onClick={() => setCreateEnvironment(!createEnvironment)}>
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${createEnvironment ? 'bg-violet-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${createEnvironment ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700">Ambiente Realista</span>
                     </div>
                     <MapPin className={`w-5 h-5 ${createEnvironment ? 'text-violet-600' : 'text-slate-300'}`} />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2 pl-14">Gera fundo contextualizado com a ocasião.</p>
              </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Escolha o Objetivo
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {LOOK_OBJECTIVES.map((obj) => (
                <button
                    key={obj.id}
                    onClick={() => generateLook(obj.id)}
                    className="relative overflow-hidden flex items-center p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left group h-28"
                >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mr-5 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                        <obj.icon className="w-7 h-7 text-slate-700 group-hover:text-violet-600 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg mb-1">{obj.label}</h4>
                        <p className="text-xs text-slate-500">{obj.desc}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600" />
                    </div>
                </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Result
  if (view === 'look-result' && generatedLook) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="relative h-[70vh] bg-slate-900 group overflow-hidden">
           <div className={`absolute inset-0 transition-opacity duration-300 ${isComparing ? 'opacity-0' : 'opacity-100'}`}>
             <img src={generatedLook.imagePlaceholder} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
           </div>

           <div className={`absolute inset-0 transition-opacity duration-300 bg-black flex items-center justify-center ${isComparing ? 'opacity-100' : 'opacity-0'}`}>
              {user.image ? (
                <img src={user.image} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="text-white">Sem Imagem Original</div>
              )}
           </div>
           
           <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
             <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
               <X className="w-5 h-5" />
             </button>
             
             <div className="flex gap-2">
                {/* Share Button Feature */}
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {/* Edit Button Feature */}
                <button 
                  onClick={() => openModal('edit', generatedLook)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Editor
                </button>
             </div>
           </div>
            
            {/* Undo/Redo & Save UI */}
           <div className="absolute bottom-40 right-6 z-30 flex flex-col gap-3">
              <button 
                 onClick={handleUndo}
                 disabled={historyIndex <= 0}
                 className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-30"
              >
                <Undo className="w-5 h-5" />
              </button>
              <button 
                 onClick={handleRedo}
                 disabled={historyIndex >= editHistory.length - 1}
                 className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-30"
              >
                <Redo className="w-5 h-5" />
              </button>
              <button 
                 onClick={saveToWardrobe}
                 className="w-10 h-10 bg-blue-800 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-blue-900 transition-colors shadow-lg"
                 title="Salvar no Guarda-Roupa"
              >
                <Save className="w-5 h-5" />
              </button>
           </div>

           <div className="absolute bottom-32 left-0 right-0 flex justify-center z-30 pointer-events-auto">
              <Button 
                variant="glass"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                className="rounded-full px-6 py-2 text-sm font-bold shadow-xl border-white/40 active:scale-95 transition-transform"
                icon={Eye}
              >
                SEGURE PARA COMPARAR
              </Button>
           </div>
        </div>

        {/* Modal for Magic Edit */}
        {modal.isOpen && modal.type === 'edit' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl p-6">
              <h3 className="text-xl font-serif text-slate-900 mb-2">Editor Mágico</h3>
              <p className="text-sm text-slate-500 mb-4">Nano Banana: Altere seu look com comandos de texto.</p>
              
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Estilo de Edição</label>
                <div className="flex gap-2">
                   {(['photorealistic', 'cinematic', 'sketch'] as EditStyle[]).map(s => (
                     <button
                       key={s}
                       onClick={() => setSelectedEditStyle(s)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${selectedEditStyle === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                     >
                       {s}
                     </button>
                   ))}
                </div>
              </div>

              <textarea 
                className="w-full p-3 border border-slate-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                rows={3}
                placeholder="Ex: 'Adicionar óculos de sol', 'Mudar fundo para praia'..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
              />
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeModal} className="flex-1">Cancelar</Button>
                <Button variant="primary" onClick={handleEditLook} disabled={isEditing || !editPrompt} className="flex-1 relative">
                  {isEditing ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      <span className="text-xs">Gerando...</span>
                    </>
                  ) : 'Gerar Edição'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 bg-white -mt-6 rounded-t-3xl relative z-20 px-6 py-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-slate-900 mb-3">{generatedLook.titulo}</h3>
          <p className="text-slate-600 text-sm">{generatedLook.detalhes}</p>
        </div>
      </div>
    );
  }

  return <div>Carregando...</div>;
};

export default VizuhalizandoApp;