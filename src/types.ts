
export type SkinTone = 'Quente' | 'Frio' | 'Neutro' | 'Oliva';

export interface ColorPalette {
  hex: string;
  nome: string;
}

export interface OutfitComponent {
  peca: string;
  loja: string;
}

export interface OutfitSuggestion {
  titulo: string;
  detalhes: string;
  ocasiao: string;
  isFavorite?: boolean;
  generatedImage?: string;
  lastModificationPrompt?: string;
  userNote?: string;
  components?: OutfitComponent[];
}

export interface VisagismoFeature {
  estilo: string;
  detalhes: string;
}

export interface Visagismo {
  cabelo: VisagismoFeature;
  barba_ou_make: VisagismoFeature;
}

export interface AnalysisResult {
  visagismo: Visagismo;
  biotipo: string;
  tom_pele_detectado: SkinTone;
  analise_pele: string;
  paleta_cores: ColorPalette[];
  sugestoes_roupa: OutfitSuggestion[];
  formato_rosto_detalhado: string;
}

export interface UserMetrics {
  height: string;
  weight: string;
}

export interface UserRole {
  id: string;
  name: string;
}
