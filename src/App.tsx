
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Share2, Sparkles, User as UserIcon, 
  Loader2, Download, LogOut, X, Menu, SwitchCamera,
  Check, Plus, Trash2, ArrowRight, Layout, Grid, SplitSquareHorizontal,
  BookOpen, Wand2, Eye, ScanFace, Timer, Heart, Edit3, Grid3X3, RefreshCw,
  Info, ShoppingBag, ExternalLink, Send, Image as ImageIcon, Filter, Save, XCircle,
  ArrowUpDown, Palette, Sliders, MapPin, Briefcase, Sun, Moon, Coffee, Dumbbell,
  Focus, Tag, Edit, Pencil, Scan
} from 'lucide-react';
import { Onboarding } from './components/Onboarding';
import { AuthModal } from './components/AuthModal';
import { Modal } from './components/Modal';
import { VisagismGuideModal } from './components/VisagismGuideModal';
import { VisagismAnalysis } from './components/VisagismAnalysis';
import { ComparisonView } from './components/ComparisonView';
import { Logo } from './components/Logo';
import { analyzeImageWithGemini, generateVisualEdit } from './services/geminiService';
import type { AnalysisResult, OutfitSuggestion, UserRole, SkinTone, ColorPalette, UserMetrics, Visagismo } from './types';

// Constants for Skin Tone Logic (Reused)
const SKIN_TONE_DATA: Record<SkinTone, { description: string; palettes: ColorPalette[]; makeup: string; color: string }> = {
    'Quente': {
        description: "Pele com fundo amarelado ou dourado. Bronzeia-se facilmente.",
        palettes: [
            { hex: "#D4AF37", nome: "Dourado" }, { hex: "#FF7F50", nome: "Coral" },
            { hex: "#8B4513", nome: "Terra" }, { hex: "#556B2F", nome: "Verde Oliva" }
        ],
        makeup: "Tons terrosos, pêssego, dourado e bronzer. Batons alaranjados ou vermelhos quentes.",
        color: "#f59e0b" // Amber 500
    },
    'Frio': {
        description: "Pele com fundo rosado ou azulado. Queima-se facilmente ao sol.",
        palettes: [
            { hex: "#000080", nome: "Azul Marinho" }, { hex: "#C0C0C0", nome: "Prata" },
            { hex: "#800080", nome: "Roxo" }, { hex: "#DC143C", nome: "Vermelho Cereja" }
        ],
        makeup: "Tons de rosa, prata, cinza e azul. Batons em tons de frutas vermelhas ou rosa frio.",
        color: "#3b82f6" // Blue 500
    },
    'Neutro': {
        description: "Equilíbrio entre quente e frio. Versátil com quase todas as cores.",
        palettes: [
            { hex: "#40E0D0", nome: "Turquesa" }, { hex: "#FF69B4", nome: "Rosa Médio" },
            { hex: "#F5F5DC", nome: "Bege" }, { hex: "#708090", nome: "Cinza Ardósia" }
        ],
        makeup: "Pode transitar entre tons quentes e frios. Foco em iluminar naturalmente.",
        color: "#a3a3a3" // Neutral Gray
    },
    'Oliva': {
        description: "Fundo esverdeado ou amarelado frio. Comum em peles médias a escuras.",
        palettes: [
            { hex: "#2F4F4F", nome: "Verde Escuro" }, { hex: "#800000", nome: "Vinho" },
            { hex: "#4B0082", nome: "Índigo" }, { hex: "#DAA520", nome: "Ocre" }
        ],
        makeup: "Tons de ameixa, beringela e metálicos profundos. Evite tons pastéis muito claros.",
        color: "#84cc16" // Lime 500
    }
};

const ENVIRONMENTS = [
  { label: 'Geral', value: 'General Style', icon: Sparkles },
  { label: 'Trabalho', value: 'Office Business', icon: Briefcase },
  { label: 'Praia/Verão', value: 'Beach Resort', icon: Sun },
  { label: 'Festa/Noite', value: 'Night Club Party', icon: Moon },
  { label: 'Casual/Encontro', value: 'Casual Date', icon: Coffee },
  { label: 'Esporte', value: 'Gym Sport', icon: Dumbbell },
];

const PRESET_TAGS = ["Trabalho", "Evento", "Conforto", "Verão", "Inverno", "Ousado", "Clássico", "Date", "Viagem"];

// Simple Toast Component (Internal)
const Toast = ({ msg, type }: { msg: string, type: 'success' | 'error' }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white font-medium z-[1000] animate-fade-in ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`}>
    {msg}
  </div>
);

// Helper: Play Camera Shutter Sound
const playShutterSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Simulating a "Click" sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
        console.warn("Audio playback failed", e);
    }
};

export default function App() {
  const [user, setUser] = useState<{ displayName: string | null; email: string | null; photoURL: string | null; uid: string } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // User Metrics (Input before analysis)
  const [metrics, setMetrics] = useState<UserMetrics>({ height: '', weight: '' });
  
  // Environment Selection
  const [targetEnvironment, setTargetEnvironment] = useState<string>('General Style');

  // Skin Tone State
  const [currentSkinTone, setCurrentSkinTone] = useState<SkinTone>('Neutro');
  
  // States required for Dossier
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  
  // States for Comparison Feature
  const [selectedOutfits, setSelectedOutfits] = useState<OutfitSuggestion[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);

  // States for Outfit Generation (Virtual Try-On)
  const [generatingOutfitIndex, setGeneratingOutfitIndex] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [viewingOutfitIndex, setViewingOutfitIndex] = useState<number | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Outfit Filtering & Sorting State
  const [activeOutfitFilter, setActiveOutfitFilter] = useState<string>('Todas');
  const [outfitSortOrder, setOutfitSortOrder] = useState<'relevance' | 'favorites'>('relevance');

  // Animation states
  const [animatedHearts, setAnimatedHearts] = useState<Record<number, boolean>>({});

  // Visagism Editing State
  const [isEditingVisagism, setIsEditingVisagism] = useState(false);
  const [tempVisagism, setTempVisagism] = useState<Visagismo | null>(null);

  // States for Visagism Guide
  const [showVisagismGuide, setShowVisagismGuide] = useState(false);
  const [showVisagismAnalysis, setShowVisagismAnalysis] = useState(false);

  // States for Manual Outfit Editing
  const [editingOutfitIndex, setEditingOutfitIndex] = useState<number | null>(null);
  const [tempOutfitData, setTempOutfitData] = useState<OutfitSuggestion | null>(null);

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState(false);
  const [timerDuration, setTimerDuration] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI States
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success'|'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Toast
  const addToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper: Save Image
  const handleSaveOrShareImage = async (dataUrl: string, filename: string) => {
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Imagem salva com sucesso!", "success");
    } catch (e) {
        console.error(e);
        addToast("Erro ao salvar imagem", "error");
    }
  };

  // Helper: Load Image for Canvas
  const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
      });
  };

  // Helper: Wrap Text for Canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
      return y + lineHeight; 
  };

  // Centralized Analysis Logic
  const runAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedOutfits([]); 
    setActiveOutfitFilter('Todas');
    try {
      const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const result = await analyzeImageWithGemini(rawBase64, metrics, targetEnvironment);
      setAnalysisResult(result);
      if (result.tom_pele_detectado) {
          setCurrentSkinTone(result.tom_pele_detectado);
      }
      addToast("Análise concluída com sucesso!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro na análise", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isCameraOpen) {
      stopCamera();
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      await runAnalysis(base64);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // --- VISAGISM EDITING LOGIC ---
  const startEditingVisagism = () => {
      if (!analysisResult) return;
      setTempVisagism(JSON.parse(JSON.stringify(analysisResult.visagismo)));
      setIsEditingVisagism(true);
  };

  const cancelEditingVisagism = () => {
      setTempVisagism(null);
      setIsEditingVisagism(false);
  };

  const saveVisagismChanges = () => {
      if (!analysisResult || !tempVisagism) return;
      setAnalysisResult({
          ...analysisResult,
          visagismo: tempVisagism
      });
      setIsEditingVisagism(false);
      addToast("Ajustes de visagismo salvos.", "success");
  };

  // --- OUTFIT EDITING LOGIC (MANUAL) ---
  const handleStartEdit = (index: number, outfit: OutfitSuggestion) => {
    setEditingOutfitIndex(index);
    setTempOutfitData(JSON.parse(JSON.stringify(outfit)));
  };

  const handleCancelEdit = () => {
    setEditingOutfitIndex(null);
    setTempOutfitData(null);
  };

  const handleSaveEdit = () => {
    if (!analysisResult || editingOutfitIndex === null || !tempOutfitData) return;
    
    // Update the outfit in the list
    const newSuggestions = [...analysisResult.sugestoes_roupa];
    
    // We update the outfit at editingOutfitIndex
    newSuggestions[editingOutfitIndex] = tempOutfitData;
    
    setAnalysisResult({ ...analysisResult, sugestoes_roupa: newSuggestions });
    setEditingOutfitIndex(null);
    setTempOutfitData(null);
    addToast("Look atualizado com sucesso!", "success");
  };

  const handleComponentChange = (compIndex: number, field: 'peca' | 'loja', value: string) => {
    if (!tempOutfitData || !tempOutfitData.components) return;
    const newComponents = [...tempOutfitData.components];
    newComponents[compIndex] = { ...newComponents[compIndex], [field]: value };
    setTempOutfitData({ ...tempOutfitData, components: newComponents });
  };

  // --- SKIN TONE UPDATE LOGIC ---
  const handleSkinToneChange = (tone: SkinTone) => {
      if (!analysisResult) return;
      setCurrentSkinTone(tone);
      const updatedData = SKIN_TONE_DATA[tone];
      const newResult = { 
          ...analysisResult,
          analise_pele: `Tom Ajustado Manualmente: ${tone}. ${updatedData.description}`,
          paleta_cores: updatedData.palettes,
          visagismo: {
              ...analysisResult.visagismo,
              barba_ou_make: {
                  ...analysisResult.visagismo.barba_ou_make,
                  detalhes: updatedData.makeup,
                  motivo: `Ajustado para subtom ${tone}`
              }
          }
      };
      setAnalysisResult(newResult);
      addToast(`Paleta recalculada para: ${tone}`, "success");
  };

  // --- OUTFIT GENERATION & REFINEMENT ---
  const handleGenerateLook = async (index: number, outfit: OutfitSuggestion, customRefinement?: string, silent = false) => {
    if (!image || !analysisResult) return;
    
    if (customRefinement) {
        setIsRefining(true);
    } else {
        setGeneratingOutfitIndex(index);
    }

    try {
        const rawBase64 = image.includes(',') ? image.split(',')[1] : image;
        
        // Uses the *latest* visagism details, including manual edits
        const currentVisagismoDescription = `Hair: ${analysisResult.visagismo.cabelo.estilo} (${analysisResult.visagismo.cabelo.detalhes}). Makeup/Beard: ${analysisResult.visagismo.barba_ou_make.estilo} (${analysisResult.visagismo.barba_ou_make.detalhes}).`;

        const modificationPrompt = `Personal Stylist Request: Wear stylish outfit: ${outfit.titulo}. Details: ${outfit.detalhes}. Style: ${outfit.ocasiao}. Perfectly fit for biotype: ${analysisResult.biotipo}. Maintain sophisticated look. Keep face identity and pose.`;
        
        const generatedImage = await generateVisualEdit(
            rawBase64,
            "clothing", 
            modificationPrompt,
            currentVisagismoDescription, // Pass updated visagism
            { biotype: analysisResult.biotipo, palette: "harmonious" },
            customRefinement
        );

        setAnalysisResult((prev) => {
            if (!prev) return null;
            const realIndex = prev.sugestoes_roupa.findIndex(o => o.titulo === outfit.titulo);
            if (realIndex === -1) return prev;

            const newSuggestions = [...prev.sugestoes_roupa];
            newSuggestions[realIndex] = { 
                ...outfit, 
                generatedImage: `data:image/png;base64,${generatedImage.includes('base64,') ? generatedImage.split(',')[1] : generatedImage}`,
                lastModificationPrompt: customRefinement
            };
            return { ...prev, sugestoes_roupa: newSuggestions };
        });
        
        if (customRefinement) {
             setRefinementPrompt(""); 
             addToast("Look refinado sob medida!", "success");
        } else if (!silent) {
             addToast("Look gerado com sucesso!", "success");
             setViewingOutfitIndex(index); 
        }

    } catch (e: any) {
        console.error(e);
        if (!silent) addToast(e.message || "Erro ao gerar visualização do look.", "error");
    } finally {
        if (!silent) setGeneratingOutfitIndex(null);
        setIsRefining(false);
    }
  };

  const handleRefinementSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (viewingOutfitIndex !== null && analysisResult && refinementPrompt.trim()) {
        handleGenerateLook(viewingOutfitIndex, analysisResult.sugestoes_roupa[viewingOutfitIndex], refinementPrompt);
    }
  };

  // --- BATCH GENERATION ---
  const handleGenerateAllLooks = async () => {
      if (!analysisResult) return;
      setIsGeneratingAll(true);
      addToast("Iniciando Provador Mágico...", "success");

      for (let i = 0; i < analysisResult.sugestoes_roupa.length; i++) {
          const outfit = analysisResult.sugestoes_roupa[i];
          if (!outfit.generatedImage) {
              setGeneratingOutfitIndex(i);
              await handleGenerateLook(i, outfit, undefined, true);
          }
      }
      
      setGeneratingOutfitIndex(null);
      setIsGeneratingAll(false);
      addToast("Todos os provadores liberados!", "success");
  };

  // --- SHARE LOOK LOGIC ---
  const handleShareLook = async (outfit: OutfitSuggestion) => {
    if (!image) return;
    addToast("Preparando imagem...", "success");
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load Images
        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = image;
        await new Promise(r => originalImg.onload = r);

        // Draw Images
        if (outfit.generatedImage) {
            const genImg = new Image();
            genImg.crossOrigin = "anonymous";
            genImg.src = outfit.generatedImage;
            await new Promise(r => genImg.onload = r);
            ctx.drawImage(originalImg, 0, 0, 540, 800, 0, 0, 540, 800); 
            ctx.drawImage(genImg, 0, 0, 540, 800, 540, 0, 540, 800);
        } else {
             ctx.drawImage(originalImg, 0, 0, 1080, 800);
        }
        
        // Footer Overlay
        ctx.fillStyle = "#0f172a"; // Dark Slate
        ctx.fillRect(0, 800, 1080, 280);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px 'Inter', sans-serif";
        ctx.fillText(outfit.titulo, 50, 860);
        
        ctx.font = "italic 30px 'Inter', serif"; 
        ctx.fillStyle = "#a5b4fc";
        ctx.fillText(`VizuHalizando AI • ${outfit.ocasiao.toUpperCase()}`, 50, 910);
        
        ctx.font = "24px 'Inter', sans-serif";
        ctx.fillStyle = "#94a3b8";
        
        const words = outfit.detalhes.split(' ');
        let line = '';
        let y = 960;
        for (let n = 0; n < words.length; n++) {
             if (ctx.measureText(line + words[n]).width > 980) {
                 ctx.fillText(line, 50, y);
                 line = words[n] + ' ';
                 y += 35;
             } else {
                 line += words[n] + ' ';
             }
        }
        ctx.fillText(line, 50, y);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        if (navigator.share) {
             const blob = await (await fetch(dataUrl)).blob();
             const file = new File([blob], "vizu-look.jpg", { type: "image/jpeg" });
             await navigator.share({
                 title: `VizuHalizando: ${outfit.titulo}`,
                 text: `Sugestão de estilo: ${outfit.detalhes}`,
                 files: [file]
             });
        } else {
             await handleSaveOrShareImage(dataUrl, `Vizu-Look-${outfit.titulo.replace(/\s/g,'-')}`);
        }

    } catch (e) {
        console.error(e);
        addToast("Erro ao compartilhar. Tente salvar.", "error");
    }
  };

  const toggleOutfitFavorite = (index: number) => {
    if (!analysisResult) return;
    
    // Trigger animation
    setAnimatedHearts(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
        setAnimatedHearts(prev => ({ ...prev, [index]: false }));
    }, 400);

    const newSuggestions = [...analysisResult.sugestoes_roupa];
    const isNowFavorite = !newSuggestions[index].isFavorite;
    
    newSuggestions[index] = { 
        ...newSuggestions[index], 
        isFavorite: isNowFavorite 
    };
    
    if (isNowFavorite) {
        addToast("Adicionado aos Favoritos", "success");
    }
    
    setAnalysisResult({ ...analysisResult, sugestoes_roupa: newSuggestions });
  };

  const updateOutfitNote = (index: number, note: string) => {
      if (!analysisResult) return;
      const newSuggestions = [...analysisResult.sugestoes_roupa];
      newSuggestions[index] = { 
          ...newSuggestions[index], 
          userNote: note 
      };
      setAnalysisResult({ ...analysisResult, sugestoes_roupa: newSuggestions });
  };

  // --- CAMERA LOGIC ---
  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(true);
      setFacingMode(mode);
      setTimeout(async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
          } catch (innerErr) {
             console.error("Camera error:", innerErr);
             addToast("Erro ao iniciar câmera.", "error");
             setIsCameraOpen(false);
          }
      }, 100);
    } catch (err) {
      console.error(err);
      addToast("Erro de permissão.", "error");
      setIsCameraOpen(false);
    }
  };

  const switchCamera = () => {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      startCamera(newMode);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCountdown(null);
  };

  const capturePhoto = () => {
    setIsFlashing(true);
    playShutterSound(); // Trigger sound
    setTimeout(() => setIsFlashing(false), 200); // 200ms flash duration

    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setTimeout(() => {
            setImage(base64);
            stopCamera();
            runAnalysis(base64);
        }, 200);
      }
    }
  };

  const handleCaptureClick = () => {
     if (timerDuration === 0) capturePhoto();
     else setCountdown(timerDuration);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(prev => prev! - 1), 1000);
      return () => clearTimeout(timerId);
    } 
    if (countdown === 0) {
       capturePhoto();
       setCountdown(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const toggleOutfitSelection = (outfit: OutfitSuggestion) => {
    const isSelected = selectedOutfits.some(o => o.titulo === outfit.titulo);
    if (isSelected) {
        setSelectedOutfits(prev => prev.filter(o => o.titulo !== outfit.titulo));
    } else {
        if (selectedOutfits.length >= 3) {
            addToast("Selecione no máximo 3 looks.", "error");
            return;
        }
        setSelectedOutfits(prev => [...prev, outfit]);
    }
  };

  const handleExportComparison = async () => {
    if (selectedOutfits.length === 0) return;
    setIsGeneratingComparison(true);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080; 
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Header
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#1e1b4b"); // Indigo 950
        gradient.addColorStop(1, "#312e81"); // Indigo 900
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 150);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 50px 'Inter', sans-serif";
        ctx.textAlign = "center";
        const userName = user?.displayName ? user.displayName.toUpperCase().split(' ')[0] : 'CLIENTE';
        ctx.fillText("VIZU HALIZANDO • BOARD COMPARATIVO", canvas.width / 2, 70);
        
        ctx.font = "italic 30px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`ANÁLISE SOB MEDIDA PARA ${userName}`, canvas.width / 2, 115);
        
        const count = selectedOutfits.length;
        const colWidth = canvas.width / count;
        const startY = 210;
        const margin = 40;

        selectedOutfits.forEach((outfit, index) => {
             const colX = index * colWidth;
             const contentX = colX + margin;
             
             ctx.fillStyle = "#1e293b";
             ctx.font = "bold 30px 'Inter', sans-serif";
             ctx.textAlign = "left";
             ctx.fillText(outfit.titulo, contentX, startY);
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        await handleSaveOrShareImage(dataUrl, `Vizu-Board-${userName}`);
    } catch (e) {
        addToast("Erro ao gerar comparativo", "error");
    } finally {
        setIsGeneratingComparison(false);
    }
  };

  // --- LOOKBOOK / DOSSIER EXPORT ---
  const handleExportAnalysis = async () => {
    if (!analysisResult || !image) return;
    setIsGeneratingDossier(true);
    
    try {
        // Filter favorites, or take top 2 if none
        const favorites = analysisResult.sugestoes_roupa.filter(o => o.isFavorite);
        const looksToExport = favorites.length > 0 ? favorites : analysisResult.sugestoes_roupa.slice(0, 2);

        // Dimensions
        const width = 1200;
        const headerHeight = 350;
        const profileHeight = 550;
        const lookHeight = 900;
        const footerHeight = 200;
        const totalHeight = headerHeight + profileHeight + (looksToExport.length * lookHeight) + footerHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = totalHeight; 
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");
        
        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, totalHeight);
        
        // --- HEADER ---
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "#1e1b4b");
        gradient.addColorStop(1, "#312e81");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, headerHeight);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 70px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`LOOKBOOK DIGITAL`, width / 2, 140);
        ctx.font = "italic 40px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        const userName = user?.displayName ? user.displayName : 'Cliente VIP';
        ctx.fillText(`Curadoria Exclusiva para ${userName}`, width / 2, 220);
        
        // --- PROFILE SECTION ---
        let currentY = headerHeight + 50;
        
        // Original Photo (Left)
        try {
            const originalImg = await loadImage(image);
            // Draw crop 3:4
            const aspect = 3/4;
            const imgW = 400;
            const imgH = imgW / aspect;
            
            // Draw rounded rect clip
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(50, currentY, imgW, imgH, 20);
            ctx.clip();
            // Scale logic simple for now
            ctx.drawImage(originalImg, 50, currentY, imgW, imgH);
            ctx.restore();
            
            // Draw Border
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 4;
            ctx.strokeRect(50, currentY, imgW, imgH);
            
            // Info (Right)
            const textX = 500;
            ctx.textAlign = "left";
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 40px 'Inter', sans-serif";
            ctx.fillText("ANÁLISE BIOMÉTRICA", textX, currentY + 50);
            
            ctx.font = "bold 24px 'Inter', sans-serif";
            ctx.fillStyle = "#64748b";
            ctx.fillText("FORMATO DE ROSTO", textX, currentY + 120);
            ctx.fillStyle = "#1e293b";
            ctx.fillText(analysisResult.formato_rosto_detalhado, textX, currentY + 155);

            ctx.fillStyle = "#64748b";
            ctx.fillText("BIOTIPO", textX, currentY + 220);
            ctx.fillStyle = "#1e293b";
            ctx.fillText(analysisResult.biotipo, textX, currentY + 255);

            ctx.fillStyle = "#64748b";
            ctx.fillText("COLORIMETRIA", textX, currentY + 320);
            ctx.fillStyle = "#1e293b";
            ctx.fillText(`${currentSkinTone} - ${analysisResult.analise_pele.substring(0, 50)}...`, textX, currentY + 355);
            
            currentY += imgH + 80; // Space after profile
        } catch (e) {
            console.error("Failed to load original image", e);
        }

        // --- LOOKS SECTION ---
        for (let i = 0; i < looksToExport.length; i++) {
            const look = looksToExport[i];
            const lookStartY = currentY;
            
            // Section Divider
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, lookStartY, width, lookHeight);
            
            // Look Title
            ctx.fillStyle = "#4f46e5"; // Indigo
            ctx.font = "bold 24px 'Inter', sans-serif";
            ctx.fillText(`LOOK ${i + 1} • ${look.ocasiao.toUpperCase()}`, 50, lookStartY + 60);
            
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 50px 'Inter', sans-serif"; 
            ctx.fillText(look.titulo, 50, lookStartY + 120);
            
            // Description
            ctx.font = "26px 'Inter', sans-serif";
            ctx.fillStyle = "#475569";
            wrapText(ctx, look.detalhes, 50, lookStartY + 180, 1100, 40);
            
            // Generated Image (if exists)
            if (look.generatedImage) {
                try {
                    const genImg = await loadImage(look.generatedImage);
                    const gW = 500;
                    const gH = 650;
                    const gX = (width - gW) / 2;
                    const gY = lookStartY + 230;
                    
                    ctx.save();
                    // Shadow
                    ctx.shadowColor = "rgba(0,0,0,0.2)";
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetY = 10;
                    
                    ctx.drawImage(genImg, gX, gY, gW, gH);
                    ctx.restore();
                    
                    // Label
                    ctx.fillStyle = "#ffffff";
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(gX + 20, gY + gH - 50, 200, 30);
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = "#000000";
                    ctx.font = "bold 16px 'Inter', sans-serif";
                    ctx.fillText("PROVA VIRTUAL", gX + 35, gY + gH - 29);
                    
                } catch (e) {
                    console.error("Failed to load generated look image", e);
                }
            } else {
                // Placeholder if no image generated
                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.strokeRect((width - 400)/2, lookStartY + 250, 400, 500);
                ctx.setLineDash([]);
                ctx.textAlign = "center";
                ctx.fillStyle = "#94a3b8";
                ctx.fillText("Visualização não gerada", width/2, lookStartY + 500);
                ctx.textAlign = "left"; // Reset
            }

            currentY += lookHeight;
        }

        // --- FOOTER ---
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(0, totalHeight - footerHeight, width, footerHeight);
        
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px 'Inter', sans-serif";
        ctx.fillText("VIZU HALIZANDO AI", width / 2, totalHeight - 110);
        ctx.font = "20px 'Inter', sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Seu estilo, nossa ciência.", width / 2, totalHeight - 70);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        await handleSaveOrShareImage(dataUrl, `Vizu-Lookbook-${userName.split(' ')[0]}`);

    } catch (e) {
        console.error(e);
        addToast("Erro ao gerar Lookbook. Tente novamente.", "error");
    } finally {
        setIsGeneratingDossier(false);
    }
  };

  // Helper to get unique occasions for filter
  const getUniqueOccasions = () => {
      if (!analysisResult) return [];
      const occasions = analysisResult.sugestoes_roupa.map(o => o.ocasiao);
      return ['Todas', ...new Set(occasions)];
  };

  // Filter outfits
  const filteredAndSortedOutfits = React.useMemo(() => {
    if (!analysisResult) return [];
    
    let result = analysisResult.sugestoes_roupa.filter(outfit => 
        activeOutfitFilter === 'Todas' || outfit.ocasiao === activeOutfitFilter
    );

    if (outfitSortOrder === 'favorites') {
        result = [...result].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }
    
    return result;
  }, [analysisResult, activeOutfitFilter, outfitSortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 pb-24">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 rounded-lg p-1.5 shadow-md shadow-indigo-500/20">
                 <Logo className="w-6 h-6 text-white" classNamePath="stroke-white" classNameEye="fill-white" />
             </div>
             <div>
                 <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                    Vizu <span className="text-indigo-600 font-sans">Halizando</span>
                 </h1>
                 <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Personal Stylist AI</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button
               onClick={() => setShowVisagismAnalysis(true)}
               className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full hover:bg-amber-100 transition-colors mr-1 border border-amber-100 dark:border-amber-800"
             >
                <Scan className="w-4 h-4" />
                Laboratório Visagismo
             </button>

             <button
               onClick={() => setShowVisagismGuide(true)}
               className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800"
             >
               <BookOpen className="w-4 h-4" />
               Guia Visagismo
             </button>
             
             <button 
                onClick={() => setShowAuth(true)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
                {user ? (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                    {user.displayName ? user.displayName[0] : 'U'}
                </div>
                ) : (
                <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                )}
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
         {/* Welcome / Upload Section */}
         {!image && !isCameraOpen && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in relative">
                 {/* Decorative background element */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                 <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Estilo <span className="italic text-indigo-600">Sob Medida</span> <br/>
                    <span className="text-3xl md:text-4xl font-sans font-normal text-slate-500 dark:text-slate-400">com Inteligência Artificial</span>
                 </h2>
                 <p className="text-slate-600 dark:text-slate-300 text-lg max-w-lg leading-relaxed">
                    Carregue uma foto para receber uma análise completa de visagismo, colorimetria e sugestões de looks exclusivos.
                 </p>
                 
                 {/* User Metrics Input */}
                 <div className="w-full max-w-md bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 mt-6 grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Altura (m)</label>
                         <input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 1.75"
                            value={metrics.height}
                            onChange={(e) => setMetrics({...metrics, height: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                         />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Peso (kg)</label>
                         <input 
                            type="number" 
                            placeholder="Ex: 80"
                            value={metrics.weight}
                            onChange={(e) => setMetrics({...metrics, weight: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                         />
                     </div>
                 </div>

                 {/* Environment Selector */}
                 <div className="w-full max-w-2xl mt-6 overflow-x-auto pb-2 custom-scrollbar">
                    <div className="flex items-center gap-2 justify-start sm:justify-center min-w-max px-2">
                        {ENVIRONMENTS.map((env) => {
                            const Icon = env.icon;
                            const isSelected = targetEnvironment === env.value;
                            return (
                                <button
                                    key={env.value}
                                    onClick={() => setTargetEnvironment(env.value)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 ${
                                        isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="text-xs font-bold whitespace-nowrap">{env.label}</span>
                                </button>
                            );
                        })}
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl shadow-slate-500/20 transition-all hover:scale-105"
                    >
                       <Upload className="w-5 h-5" />
                       Carregar Foto
                    </button>
                    
                    <button 
                       onClick={() => startCamera('user')}
                       className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all hover:scale-105"
                    >
                       <Camera className="w-5 h-5" />
                       Espelho Digital
                    </button>
                 </div>

                 {/* Mobile Visagism Lab Button (Visible only on small screens) */}
                 <div className="mt-4 md:hidden">
                    <button
                        onClick={() => setShowVisagismAnalysis(true)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full hover:bg-amber-100 transition-colors border border-amber-100 dark:border-amber-800"
                    >
                        <Scan className="w-4 h-4" />
                        Laboratório Visagismo
                    </button>
                 </div>
             </div>
         )}

         {/* Full Screen Camera View */}
         {isCameraOpen && (
             <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                 <div className="relative flex-1 overflow-hidden group">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover transition-transform duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    
                    {/* Visual Flash Effect */}
                    <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Countdown Overlay */}
                    {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                            <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
                                {countdown}
                            </span>
                        </div>
                    )}

                    {/* Grid Overlay */}
                    {showGrid && (
                        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-30">
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-white"></div>
                            <div className="border-r border-white"></div>
                            <div className=""></div>
                        </div>
                    )}

                    {/* Improved Face Guide - Silhouette Style */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-60">
                        <div className="relative">
                            <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                                <path d="M150 50C94.7715 50 50 94.7715 50 150V250C50 305.228 94.7715 350 150 350C205.228 350 250 305.228 250 250V150C250 94.7715 205.228 50 150 50Z" stroke="white" strokeWidth="3" strokeDasharray="10 10"/>
                                <path d="M150 30V50" stroke="white" strokeWidth="2"/>
                                <path d="M150 350V370" stroke="white" strokeWidth="2"/>
                            </svg>
                            <p className="text-white text-center mt-4 font-bold tracking-widest text-sm drop-shadow-md">POSICIONE O ROSTO</p>
                        </div>
                    </div>
                    
                    {/* Camera Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
                        <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                        <div className="flex gap-4">
                            <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full backdrop-blur-md transition-colors ${showGrid ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                                <Grid3X3 className="w-6 h-6"/>
                            </button>
                            <button onClick={() => setTimerDuration(prev => prev === 0 ? 3 : prev === 3 ? 10 : 0)} className={`p-3 rounded-full backdrop-blur-md transition-colors ${timerDuration > 0 ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'} flex items-center justify-center min-w-[48px]`}>
                                {timerDuration > 0 ? <span className="font-bold text-sm">{timerDuration}s</span> : <Timer className="w-6 h-6"/>}
                            </button>
                        </div>
                    </div>

                    {/* Camera Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center z-50">
                        <div className="w-12"></div> {/* Spacer */}
                        <button 
                            onClick={handleCaptureClick}
                            className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-900"></div>
                        </button>
                        <button onClick={switchCamera} className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                            <SwitchCamera className="w-6 h-6"/>
                        </button>
                    </div>
                 </div>
             </div>
         )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

      {/* Analysis Modals */}
      {showOnboarding && <Onboarding onStart={() => setShowOnboarding(false)} onLogin={() => { setShowOnboarding(false); setShowAuth(true); }} />}
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); setShowAuth(false); }} />}
      {showVisagismGuide && <VisagismGuideModal isOpen={showVisagismGuide} onClose={() => setShowVisagismGuide(false)} />}
      
      {showVisagismAnalysis && analysisResult && (
         <VisagismAnalysis data={analysisResult} onClose={() => setShowVisagismAnalysis(false)} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Main Analysis Results */}
      {analysisResult && (
        <div className="container mx-auto px-4 pb-20 max-w-5xl space-y-8">
            {/* ... Rest of your component rendering logic ... */}
            {/* Assuming basic layout since full render was not provided in user prompt but implied functionality */}
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                <h2 className="text-2xl font-bold dark:text-white">Análise Completa</h2>
                <p className="dark:text-slate-300 mt-2">Biotipo: {analysisResult.biotipo}</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="p-4 border dark:border-slate-700 rounded-lg">
                        <h3 className="font-bold dark:text-white">Visagismo</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Rosto: {analysisResult.formato_rosto_detalhado}</p>
                    </div>
                     <div className="p-4 border dark:border-slate-700 rounded-lg">
                        <h3 className="font-bold dark:text-white">Colorimetria</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Tom: {analysisResult.tom_pele_detectado}</p>
                        <div className="flex gap-2 mt-2">
                            {analysisResult.paleta_cores.map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-full" style={{backgroundColor: c.hex}} title={c.nome}></div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredAndSortedOutfits.map((outfit, index) => (
                        <div key={index} className="border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                             <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 relative">
                                {outfit.generatedImage ? (
                                    <img src={outfit.generatedImage} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <ImageIcon className="w-8 h-8"/>
                                    </div>
                                )}
                             </div>
                             <div className="p-4">
                                <h4 className="font-bold text-sm dark:text-white truncate">{outfit.titulo}</h4>
                                <p className="text-xs text-slate-500 mt-1">{outfit.ocasiao}</p>
                                <div className="mt-4 flex gap-2">
                                    <button 
                                        onClick={() => handleGenerateLook(index, outfit)}
                                        className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                                    >
                                        Provador Virtual
                                    </button>
                                     <button 
                                        onClick={() => toggleOutfitFavorite(index)}
                                        className={`p-2 rounded-lg border ${outfit.isFavorite ? 'bg-pink-50 border-pink-200 text-pink-600' : 'border-slate-200 text-slate-400'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${outfit.isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center backdrop-blur-md">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold dark:text-white">Analisando sua imagem...</h3>
            <p className="text-slate-500 mt-2">Nossa IA está identificando seus traços e estilo.</p>
        </div>
      )}
    </div>
  );
}
