import React, { useState } from 'react';
import { Modal } from './Modal';
import { BookOpen, Scissors, Palette, User, Sparkles, Smile, Glasses, Tag, Info } from 'lucide-react';

interface VisagismGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FaceShapeKey = 'Oval' | 'Redondo' | 'Quadrado' | 'Retangular' | 'Triangular' | 'Triângulo Invertido' | 'Hexagonal' | 'Coração';

interface RecommendationDetail {
    description: string;
    styles: string[];
    visualGuide: string;
}

const FACE_SHAPES: Record<FaceShapeKey, {
  description: string;
  impression: string;
  temperament: string;
  svgPath: React.ReactNode;
  strategyVisual: React.ReactNode;
  recommendations: {
    Masculino: {
      hair: RecommendationDetail;
      beard: RecommendationDetail;
      accessories: RecommendationDetail;
    },
    Feminino: {
      hair: RecommendationDetail;
      makeup: RecommendationDetail;
      accessories: RecommendationDetail;
    }
  }
}> = {
  'Oval': {
    description: "Equilibrado, levemente mais largo nas maçãs, afilando suavemente para o queixo.",
    impression: "Equilíbrio, suavidade e diplomacia. Considerado o formato 'ideal' pela simetria.",
    temperament: "Misto (Equilíbrio)",
    svgPath: <ellipse cx="50" cy="50" rx="30" ry="45" stroke="currentColor" strokeWidth="2" fill="none" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
            <path d="M50 20 V80" strokeDasharray="4 4" opacity="0.5" />
            <path d="M20 50 H80" strokeDasharray="4 4" opacity="0.5" />
            <circle cx="50" cy="50" r="3" fill="currentColor" />
            <path d="M35 35 L65 35" strokeWidth="1" />
            <path d="M35 65 L65 65" strokeWidth="1" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">SIMETRIA TOTAL</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "A versatilidade é total. O objetivo é manter a harmonia natural sem esconder o contorno.",
            styles: ["Undercut Clássico", "Buzz Cut (Militar)", "Slicked Back", "Quiff Moderno"],
            visualGuide: "Visual referência: Laterais baixas e topo com volume moderado, revelando a testa para destacar a simetria."
        },
        beard: {
            description: "Opte por linhas que definam o maxilar sem adicionar volume excessivo nas laterais.",
            styles: ["Stubble (Por fazer)", "Barba Boxed (Desenhada)", "Rosto Limpo"],
            visualGuide: "Visual referência: Barba cerrada e bem desenhada no pescoço, criando uma sombra que define o maxilar."
        },
        accessories: {
            description: "A maioria das armações funciona. O ideal é que sejam da largura do rosto.",
            styles: ["Aviador", "Wayfarer", "Clubmaster"],
            visualGuide: "Visual referência: Armações levemente retangulares que contrastam suavemente com as curvas do rosto."
        }
      },
      'Feminino': {
        hair: {
            description: "Liberdade total. Cortes que mostram o rosto são ótimos para valorizar a simetria.",
            styles: ["Long Bob", "Pixie Cut", "Longo em Camadas", "Blunt Cut"],
            visualGuide: "Visual referência: Cabelo repartido ao meio com ondas suaves ou um corte Pixie moderno expondo o pescoço."
        },
        makeup: {
            description: "Foco em realçar, não corrigir. Iluminação central funciona muito bem.",
            styles: ["Make Natural (Glow)", "Delineado Gatinho", "Blush nas maçãs"],
            visualGuide: "Visual referência: Pele iluminada (Strobing) no centro da testa, nariz e queixo."
        },
        accessories: {
            description: "Divirta-se com tendências. O equilíbrio permite ousadia.",
            styles: ["Argolas", "Óculos Gatinho", "Óculos Oversized"],
            visualGuide: "Visual referência: Brincos geométricos ou argolas clássicas que acompanham a curvatura do rosto."
        }
      }
    }
  },
  'Redondo': {
    description: "Largura e altura similares. Sem ângulos definidos, bochechas preenchidas.",
    impression: "Jovialidade, acessibilidade, doçura. Pode parecer infantil.",
    temperament: "Fleumático / Sanguíneo",
    svgPath: <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" fill="none" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
            <path d="M50 50 L50 15" markerEnd="url(#arrow)" />
            <path d="M50 50 L50 85" markerEnd="url(#arrow)" />
            <path d="M25 25 L35 35" opacity="0.5" />
            <path d="M75 25 L65 35" opacity="0.5" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">VERTICALIZAR</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Crie altura e ângulos. Laterais curtas e topo alto alongam a silhueta.",
            styles: ["Pompadour", "Faux Hawk", "High Fade", "Side Part com volume"],
            visualGuide: "Visual referência: Topete alto estruturado (Pompadour) com laterais em degradê (Fade) bem curto."
        },
        beard: {
            description: "Essencial para criar ângulos. Alongue o queixo e evite volume nas bochechas.",
            styles: ["Cavanhaque Alongado", "Barba em V (Ducktail)", "Van Dyke"],
            visualGuide: "Visual referência: Barba mais comprida e pontuda no queixo, com as laterais das bochechas raspadas ou baixas."
        },
        accessories: {
            description: "Contraste as curvas com linhas retas e angulares.",
            styles: ["Retangulares", "Quadrados (Wayfarer)", "Hastes grossas"],
            visualGuide: "Visual referência: Armações quadradas de acetato grosso para criar linhas de força."
        }
      },
      'Feminino': {
        hair: {
            description: "Busque verticalização. Riscas laterais e volume no topo ajudam a alongar.",
            styles: ["Longo Liso", "Chanel de Bico (Angulado)", "Franja Lateral Longa"],
            visualGuide: "Visual referência: Long Bob assimétrico (bico frontal) ou cabelo longo liso chapado para criar linhas verticais."
        },
        makeup: {
            description: "Técnica de luz e sombra para esculpir ângulos inexistentes.",
            styles: ["Contorno Lateral Forte", "Iluminador no Queixo", "Sobrancelha Arqueada"],
            visualGuide: "Visual referência: Contorno escuro abaixo das maçãs do rosto em diagonal ascendente para 'afinar' a face."
        },
        accessories: {
            description: "Evite formas redondas. Busque linhas verticais e pontiagudas.",
            styles: ["Brincos Longos/Lineares", "Óculos Quadrados", "Decotes em V"],
            visualGuide: "Visual referência: Brincos longos de franja ou corrente que ultrapassem a linha do maxilar."
        }
      }
    }
  },
  'Quadrado': {
    description: "Testa, maçãs e maxilar com larguras similares. Maxilar bem definido e anguloso.",
    impression: "Força, segurança, autoridade e liderança.",
    temperament: "Colérico",
    svgPath: <rect x="20" y="20" width="60" height="60" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
             {/* Softening corners */}
            <path d="M20 20 Q 50 10 80 20" />
            <path d="M20 80 Q 50 90 80 80" />
            <path d="M20 20 Q 10 50 20 80" />
            <path d="M80 20 Q 90 50 80 80" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">SUAVIZAR CANTOS</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Suavize os cantos ou abrace a severidade. Cortes clássicos funcionam bem.",
            styles: ["Crew Cut", "Side Part Clássico", "Texturizado no topo"],
            visualGuide: "Visual referência: Corte militar baixo (Crew Cut) para destacar a masculinidade ou texturizado para suavizar."
        },
        beard: {
            description: "Arredonde levemente a região do queixo para suavizar a imagem de autoridade.",
            styles: ["Barba Circular", "Barba Real (Queixo+Bigode)", "Stubble Média"],
            visualGuide: "Visual referência: Barba 'por fazer' que cobre a angulação óssea sem esconder a estrutura forte."
        },
        accessories: {
            description: "Óculos redondos suavizam. Óculos quadrados reforçam a autoridade.",
            styles: ["Redondos (John Lennon)", "Ovais", "Aviador"],
            visualGuide: "Visual referência: Óculos de metal fino redondos para intelectualizar e suavizar a força do rosto."
        }
      },
      'Feminino': {
        hair: {
            description: "Ondas e camadas suavizam a linha rígida do maxilar.",
            styles: ["Ondas de Praia (Waves)", "Shag Hair", "Franja Cortina (Curtain Bangs)"],
            visualGuide: "Visual referência: Cabelo solto com ondas largas (Baby Liss) começando abaixo da orelha."
        },
        makeup: {
            description: "Suavize o maxilar. Foque a atenção no centro do rosto e olhos.",
            styles: ["Blush Arredondado", "Olhos Esfumados", "Batom Nude"],
            visualGuide: "Visual referência: Blush aplicado em movimentos circulares nas maçãs para quebrar as linhas retas."
        },
        accessories: {
            description: "Formas orgânicas e arredondadas quebram a rigidez.",
            styles: ["Argolas Grandes", "Colares Curvos", "Óculos Redondos/Ovais"],
            visualGuide: "Visual referência: Brincos de argola dourados médios ou colares de pérolas."
        }
      }
    }
  },
  'Retangular': {
    description: "Similar ao quadrado, mas alongado. Testa alta e maxilar reto.",
    impression: "Intelecto, tradição, seriedade. Pode parecer distante.",
    temperament: "Melancólico",
    svgPath: <rect x="25" y="15" width="50" height="70" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
            {/* Horizontal expansion */}
            <path d="M50 50 L10 50" markerEnd="url(#arrow)" />
            <path d="M50 50 L90 50" markerEnd="url(#arrow)" />
            {/* Shortening top/bottom */}
            <path d="M30 15 H70" strokeWidth="3" opacity="0.5" />
            <path d="M30 85 H70" strokeWidth="3" opacity="0.5" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">ALARGAR LATERAIS</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Evite laterais muito raspadas. O volume lateral equilibra o comprimento.",
            styles: ["Corte Tesoura Clássico", "Franja Lateral", "Buzz Cut (se quiser destacar)"],
            visualGuide: "Visual referência: Corte clássico de tesoura, com laterais mais cheias e franja penteada para o lado."
        },
        beard: {
            description: "Preencha as laterais e mantenha o queixo curto para não alongar mais.",
            styles: ["Barba Cheia (Full Beard)", "Mutton Chops Suave", "Bigode Forte"],
            visualGuide: "Visual referência: Barba cheia nas bochechas e curta no queixo para criar largura horizontal."
        },
        accessories: {
            description: "Óculos grandes que quebram a extensão vertical do rosto.",
            styles: ["Aviador Grande", "Wayfarer Oversized", "Hastes decoradas"],
            visualGuide: "Visual referência: Óculos estilo Aviador Oversized que cobrem uma boa porção vertical do rosto."
        }
      },
      'Feminino': {
        hair: {
            description: "Volume lateral é o segredo. Franjas ajudam a diminuir a testa.",
            styles: ["Cachos Volumosos", "Franja Reta", "Corte em Camadas Médio"],
            visualGuide: "Visual referência: Franja reta na altura da sobrancelha combinada com corte em camadas volumoso."
        },
        makeup: {
            description: "Contorno na raiz do cabelo e ponta do queixo para 'encurtar' o rosto.",
            styles: ["Blush Horizontal", "Contorno Testa/Queixo", "Olhos Marcados"],
            visualGuide: "Visual referência: Aplicação de bronzer no topo da testa (rente à raiz) e na ponta do queixo."
        },
        accessories: {
            description: "Peças largas e curtas. Evite brincos longos que toquem o ombro.",
            styles: ["Brincos Botão Grandes", "Gargantilhas (Chokers)", "Óculos Largos"],
            visualGuide: "Visual referência: Colares estilo Gargantilha (Choker) para 'cortar' a linha vertical do pescoço."
        }
      }
    }
  },
  'Triangular': {
    description: "Maxilar mais largo que a testa. Base do rosto dominante.",
    impression: "Estabilidade, praticidade, autoridade na base.",
    temperament: "Fleumático (Terra)",
    svgPath: <path d="M50 20 L80 80 L20 80 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
            {/* Arrows expanding top */}
            <path d="M50 30 L20 20" markerEnd="url(#arrow)" />
            <path d="M50 30 L80 20" markerEnd="url(#arrow)" />
            {/* Minimize bottom */}
            <circle cx="50" cy="80" r="5" fill="currentColor" opacity="0.3" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">VOLUME SUPERIOR</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Adicione volume nas laterais superiores e topo para equilibrar a base larga.",
            styles: ["Topete Volumoso", "Messy Hair (Bagunçado)", "Franja Longa"],
            visualGuide: "Visual referência: Cabelo texturizado 'bagunçado' com volume concentrado nas têmporas e topo."
        },
        beard: {
            description: "Evite volume nas laterais do maxilar. Mantenha limpo ou muito curto.",
            styles: ["Rosto Limpo", "Bigode + Soul Patch", "Barba Desenhada Fina"],
            visualGuide: "Visual referência: Rosto limpo (Clean Shaven) ou apenas um bigode destacado para chamar atenção para o centro."
        },
        accessories: {
            description: "Destaque a parte superior do rosto para tirar o foco do maxilar.",
            styles: ["Browline (Clubmaster)", "Aviador", "Óculos Meio-Aro"],
            visualGuide: "Visual referência: Óculos Clubmaster (aro superior grosso) que enfatizam a linha da sobrancelha."
        }
      },
      'Feminino': {
        hair: {
            description: "Volume no topo e nas têmporas. Evite cortes retos na altura do queixo.",
            styles: ["Coque Alto Bagunçado", "Pixie com Volume", "Camadas Superiores"],
            visualGuide: "Visual referência: Coque alto despojado (Messy Bun) para atrair o olhar para o topo da cabeça."
        },
        makeup: {
            description: "Ilumine a testa e o centro. Escureça levemente as laterais do maxilar.",
            styles: ["Iluminador Têmporas", "Olhos Gatinho", "Batom Suave"],
            visualGuide: "Visual referência: Olhos bem marcados com delineador e iluminador nas têmporas para alargar a parte superior."
        },
        accessories: {
            description: "Traga o peso visual para cima (orelhas e pescoço).",
            styles: ["Brincos Pequenos/Médios", "Colares Curtos", "Óculos Gatinho"],
            visualGuide: "Visual referência: Brincos pequenos brilhantes ou colares curtos que repousem na clavícula."
        }
      }
    }
  },
  'Triângulo Invertido': {
    description: "Testa larga e queixo fino/pontudo. Formato de 'V'.",
    impression: "Dinamismo, criatividade, leveza. Pode parecer instável.",
    temperament: "Sanguíneo (Ar)",
    svgPath: <path d="M20 20 L80 20 L50 80 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
             {/* Minimize top */}
            <circle cx="50" cy="20" r="5" fill="currentColor" opacity="0.3" />
            {/* Expand bottom */}
            <path d="M50 70 L20 80" markerEnd="url(#arrow)" />
            <path d="M50 70 L80 80" markerEnd="url(#arrow)" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">VOLUME INFERIOR</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Sua testa já é larga, evite volume excessivo nas laterais superiores.",
            styles: ["Franja Caída", "Corte César", "Texturizado Baixo"],
            visualGuide: "Visual referência: Franja desfiada caindo sobre a testa para reduzir a percepção de largura."
        },
        beard: {
            description: "A melhor amiga deste formato. Use a barba para criar volume no queixo.",
            styles: ["Barba Cheia (Full Beard)", "Garibaldi", "Barba Lenhador"],
            visualGuide: "Visual referência: Barba cheia e arredondada na base para adicionar peso visual ao queixo fino."
        },
        accessories: {
            description: "Evite armações muito largas que ultrapassem as têmporas.",
            styles: ["Óculos Redondos", "Óculos sem aro", "Armações leves"],
            visualGuide: "Visual referência: Óculos de metal fino e aro arredondado que não ultrapassam a largura do rosto."
        }
      },
      'Feminino': {
        hair: {
            description: "Adicione volume na altura do queixo para equilibrar a testa.",
            styles: ["Chanel Clássico", "Longo com Ondas nas pontas", "Side Swept"],
            visualGuide: "Visual referência: Corte Chanel na altura do queixo com pontas volumosas viradas para dentro."
        },
        makeup: {
            description: "Suavize a testa com contorno. Ilumine a lateral do maxilar.",
            styles: ["Contorno Têmporas", "Batom Vibrante (destaque boca)", "Sobrancelha Natural"],
            visualGuide: "Visual referência: Batom em tom vibrante (vermelho ou vinho) para ancorar o olhar na parte inferior."
        },
        accessories: {
            description: "Brincos com base larga (formato gota ou triângulo) funcionam perfeitamente.",
            styles: ["Brincos Gota", "Colares Longos", "Óculos Aviador"],
            visualGuide: "Visual referência: Brincos em formato de gota ou pêndulo com base larga."
        }
      }
    }
  },
  'Hexagonal': {
    description: "Maçãs largas e proeminentes, testa e queixo estreitos. Anguloso.",
    impression: "Sofisticação, exotismo, direção. Dramático.",
    temperament: "Misto (Sanguíneo/Colérico)",
    svgPath: <polygon points="50,15 85,50 50,85 15,50" stroke="currentColor" strokeWidth="2" fill="none" />,
    strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
             {/* Smooth cheekbones */}
            <path d="M20 50 Q 50 50 80 50" strokeDasharray="2 2" />
            <path d="M15 50 Q 10 50 5 50" opacity="0.3" />
            <path d="M85 50 Q 90 50 95 50" opacity="0.3" />
            {/* Fill top/bottom width */}
            <path d="M50 20 L20 20" opacity="0.5" />
            <path d="M50 20 L80 20" opacity="0.5" />
            <path d="M50 80 L30 80" opacity="0.5" />
            <path d="M50 80 L70 80" opacity="0.5" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">SUAVIZAR ÂNGULOS</text>
        </g>
    ),
    recommendations: {
      'Masculino': {
        hair: {
            description: "Evite laterais muito curtas que destaquem as orelhas/maçãs.",
            styles: ["Faux Hawk", "Texturizado com Franja", "Longo Masculino"],
            visualGuide: "Visual referência: Cabelo com textura no topo e franja desconectada, evitando raspagem total nas laterais."
        },
        beard: {
            description: "Preencha o queixo para tirar a aparência 'pontuda'.",
            styles: ["Barba Cerrada", "Goatee Largo", "Barba Quadrada"],
            visualGuide: "Visual referência: Barba cerrada (Stubble) uniforme em todo o rosto para suavizar a angulação das maçãs."
        },
        accessories: {
            description: "Óculos que contrastem com as maçãs angulosas.",
            styles: ["Ovais", "Aviador Curvo", "Hastes detalhadas"],
            visualGuide: "Visual referência: Óculos ovais ou aviadores com curvas suaves para contrapor os ângulos agudos."
        }
      },
      'Feminino': {
        hair: {
            description: "Mostre essas maçãs! Ou use franjas laterais para suavizar.",
            styles: ["Rabo de Cavalo Alto", "Wolf Cut", "Franja Lateral"],
            visualGuide: "Visual referência: Rabo de cavalo alto e puxado (Sleek Ponytail) destacando a estrutura óssea dramática."
        },
        makeup: {
            description: "Ilumine o centro da testa e queixo. Suavize a ponta das maçãs.",
            styles: ["Iluminador Central", "Blush Suave", "Olhos Esfumados"],
            visualGuide: "Visual referência: Iluminador aplicado no 'C' ao redor dos olhos e têmporas, evitando contorno escuro nas maçãs."
        },
        accessories: {
            description: "Argolas são excelentes para suavizar os ângulos laterais.",
            styles: ["Argolas Médias", "Brincos Ovais", "Óculos Borboleta"],
            visualGuide: "Visual referência: Argolas médias douradas ou prateadas que adicionam curvatura às laterais do rosto."
        }
      }
    }
  },
  'Coração': {
     description: "Triângulo invertido com pico da viúva (linha do cabelo) arredondado.",
     impression: "Romantismo, sensibilidade e charme.",
     temperament: "Sanguíneo",
     svgPath: <path d="M50 80 C20 50 10 30 30 20 C40 15 50 30 50 30 C50 30 60 15 70 20 C90 30 80 50 50 80" stroke="currentColor" strokeWidth="2" fill="none" />,
     strategyVisual: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
             {/* Focus bottom */}
            <path d="M50 70 L20 85" markerEnd="url(#arrow)" />
            <path d="M50 70 L80 85" markerEnd="url(#arrow)" />
             {/* Soften forehead */}
            <path d="M30 20 Q 50 30 70 20" strokeDasharray="2 2" opacity="0.6" />
            <text x="50" y="95" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">EQUILIBRAR TESTA</text>
        </g>
    ),
     recommendations: {
        'Masculino': {
           hair: { 
             description: "Cortes que suavizem a testa larga. Volume médio.", 
             styles: ["Franja Texturizada", "Medium Length Push Back"],
             visualGuide: "Visual referência: Cabelo penteado para trás mas com volume e textura natural, sem estar colado na cabeça." 
           },
           beard: { 
             description: "Adicione peso ao queixo para equilibrar a testa.", 
             styles: ["Barba Cheia", "Extended Goatee", "Barba Lenhador"],
             visualGuide: "Visual referência: Cavanhaque estendido (Extended Goatee) que conecta bigode e queixo, alargando a parte inferior." 
           },
           accessories: { 
             description: "Armações leves e arredondadas na parte inferior.", 
             styles: ["Clubmaster", "Redondos", "Meio-Aro"],
             visualGuide: "Visual referência: Óculos com aro inferior invisível ou muito fino para não pesar no rosto delicado." 
           }
        },
        'Feminino': {
           hair: { 
             description: "Longo com camadas começando no queixo. Franja cortina.", 
             styles: ["Camadas Longas", "Side Swept Bangs", "Lob"],
             visualGuide: "Visual referência: Franja 'cortina' (Curtain Bangs) dividida ao meio, suavizando a testa e as têmporas." 
           },
           makeup: { 
             description: "Foco nos olhos, mas sem alargar. Batons suaves ou gloss.", 
             styles: ["Foco nos Cílios", "Batom Nude/Rosado", "Contorno Testa"],
             visualGuide: "Visual referência: Muita máscara de cílios e batom Gloss rosado, mantendo a aparência fresca e romântica." 
           },
           accessories: { 
             description: "Brincos pendentes com volume na base.", 
             styles: ["Brincos Chandelier", "Óculos sem aro", "Colares em camadas"],
             visualGuide: "Visual referência: Brincos estilo candelabro (Chandelier) que são largos na parte de baixo." 
           }
        }
     }
  }
};

const FaceStrategyVisual: React.FC<{ shapeKey: FaceShapeKey }> = ({ shapeKey }) => {
    return (
        <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center p-4 relative overflow-hidden group">
            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500 dark:text-indigo-400">
                <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
                    </marker>
                </defs>
                {/* Background Face Outline (Faded) */}
                <g className="text-slate-300 dark:text-slate-600 opacity-30">
                     {FACE_SHAPES[shapeKey].svgPath}
                </g>
                {/* Strategy Layer */}
                {FACE_SHAPES[shapeKey].strategyVisual}
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 bg-white/80 dark:bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                OBJETIVO
            </div>
        </div>
    );
};

export const VisagismGuideModal: React.FC<VisagismGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedShape, setSelectedShape] = useState<FaceShapeKey>('Oval');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consultoria Visagista Avançada"
    >
      <div className="flex flex-col gap-6">
        
        {/* Intro Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg mb-1">
                    Harmonização Facial & Identidade
                </h4>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed max-w-3xl">
                    Cada formato de rosto expressa um temperamento. Use estas referências visuais para escolher cortes e acessórios que equilibrem suas proporções ou reforcem sua mensagem pessoal.
                </p>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Sidebar: Face Shape Selector */}
            <div className="lg:col-span-3 space-y-2 lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Formatos</h5>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {(Object.keys(FACE_SHAPES) as FaceShapeKey[]).map((shape) => (
                        <button
                            key={shape}
                            onClick={() => setSelectedShape(shape)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                selectedShape === shape
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 flex-shrink-0 ${selectedShape === shape ? 'text-white' : 'text-slate-400'}`}>
                                <svg viewBox="0 0 100 100" className="w-full h-full fill-current opacity-20">
                                    {FACE_SHAPES[shape].svgPath}
                                </svg>
                            </div>
                            <span className="font-semibold text-sm truncate">{shape}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 flex flex-col gap-6">
                {/* Header Card */}
                <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-indigo-50 dark:from-indigo-900/20 to-transparent pointer-events-none" />
                    
                    <div className="w-24 h-24 flex-shrink-0 text-indigo-600 dark:text-indigo-400 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border-4 border-white dark:border-slate-800 shadow-xl">
                        <svg viewBox="0 0 100 100" className="w-full h-full stroke-current fill-none" strokeWidth="3">
                            {FACE_SHAPES[selectedShape].svgPath}
                        </svg>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedShape}</h2>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {FACE_SHAPES[selectedShape].temperament}
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                            {FACE_SHAPES[selectedShape].description}
                        </p>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                            Mensagem: {FACE_SHAPES[selectedShape].impression}
                        </p>
                    </div>
                </div>

                {/* VISUAL STRATEGY SECTION (NEW) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-1">
                        <FaceStrategyVisual shapeKey={selectedShape} />
                     </div>
                     <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800 flex flex-col justify-center">
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Estratégia Visual
                        </h4>
                        <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
                           A ilustração ao lado mostra as linhas de força ideais para este formato. O objetivo é equilibrar as proporções usando cabelo, barba e acessórios para criar a ilusão de um rosto mais oval (simétrico).
                        </p>
                        <div className="mt-4 flex gap-4 text-xs font-bold text-slate-500">
                             <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                 Contorno Original
                             </div>
                             <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                 Linhas de Correção
                             </div>
                        </div>
                     </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Masculine Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                            <User className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Masculino</h3>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6 hover:border-blue-200 transition-colors">
                            
                            {/* Hair */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                                    <Scissors className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cabelo</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.hair.description}
                                    </p>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                         <p className="text-xs text-slate-500 uppercase font-bold mb-1">Referência Visual</p>
                                         <p className="text-xs text-blue-600 dark:text-blue-300 italic font-medium">
                                            "{FACE_SHAPES[selectedShape].recommendations.Masculino.hair.visualGuide}"
                                         </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.hair.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Beard */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                                    <Smile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Barba</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.beard.description}
                                    </p>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                         <p className="text-xs text-slate-500 uppercase font-bold mb-1">Referência Visual</p>
                                         <p className="text-xs text-blue-600 dark:text-blue-300 italic font-medium">
                                            "{FACE_SHAPES[selectedShape].recommendations.Masculino.beard.visualGuide}"
                                         </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.beard.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Accessories */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                                    <Glasses className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Óculos</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.accessories.description}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 italic">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.accessories.visualGuide}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Masculino.accessories.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feminine Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                            <User className="w-5 h-5 text-pink-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Feminino</h3>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6 hover:border-pink-200 transition-colors">
                            
                            {/* Hair */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg h-fit">
                                    <Scissors className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cabelo</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.hair.description}
                                    </p>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                         <p className="text-xs text-slate-500 uppercase font-bold mb-1">Referência Visual</p>
                                         <p className="text-xs text-pink-600 dark:text-pink-300 italic font-medium">
                                            "{FACE_SHAPES[selectedShape].recommendations.Feminino.hair.visualGuide}"
                                         </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.hair.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Makeup */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg h-fit">
                                    <Palette className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Maquiagem</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.makeup.description}
                                    </p>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                         <p className="text-xs text-slate-500 uppercase font-bold mb-1">Referência Visual</p>
                                         <p className="text-xs text-pink-600 dark:text-pink-300 italic font-medium">
                                            "{FACE_SHAPES[selectedShape].recommendations.Feminino.makeup.visualGuide}"
                                         </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.makeup.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Accessories */}
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg h-fit">
                                    <Glasses className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Acessórios</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.accessories.description}
                                    </p>
                                    <p className="text-xs text-pink-600 dark:text-pink-300 italic">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.accessories.visualGuide}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {FACE_SHAPES[selectedShape].recommendations.Feminino.accessories.styles.map(style => (
                                            <span key={style} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Modal>
  );
};