import { GameSession, Language, TurnChaosEvent, TurnChaosType, ChaosEvent, MinigameCard, MinigameCardActionType, MinigameCardOutcome, GameState } from '../types';
import { generateId, shuffleArray } from './gameUtils';
import { MINIGAME_CARDS_TO_DRAW } from '../constants';

export const CHAOS_NICKNAMES = {
  [Language.EN]: [
    "the Jester", "Captain Forgetful", "Sir Giggles", "Professor Pudding", "Agent Goofball",
    "Duke of Doodles", "Madam Mumbles", "The Mystery Whisperer", "The Iron Man", "The Duke",
    "The Duchess", "The King", "Gummy Bear", "Dry Cracker", "Hummus",
    "Pizza Destroyer", "Croissant Prophet", "Fridge Lurker", "Pasta Horse", "Mr. Toast",
    "Spoon Supervisor", "Cat Supervisor", "Towel Folder", "Wet-Wipe Sniffer", "The Battleaxe",
    "Stump Sharpener", "Whale Watcher", "The Cardboard Box", "Enough Already", "Picture of Halva", "Yogurt Eater",
    "The WiFi Thief", "Lord of the Couch", "Caffeine Zombie", "Professional Procrastinator", "Sock Monster",
    "Master of Awkward Silences", "Midnight Snacker", "The Overthinker", "Emergency Snack Hoarder", "The Drama Flamingo"
  ],
  [Language.HE]: [
    "הליצן", "קפטן שכחן", "סר צחקוק", "פרופסור פודינג", "סוכן שטותניק",
    "דוכס השרבוטים", "גברת ממלמלת", "הלוחש המסתורי", "האיירון-מן", "הדוכס",
    "הדוכסית", "המלך", "גומי-גם", "קרקר יבש", "חומוס",
    "משמיד הפיצות", "נביא הקרואסון", "מתחבא במקרר", "סוס הפסטה", "מר טוסט",
    "משגיח הכפיות", "משגיח החתולים", "מקפלת המגבות", "מרחרחת מגבונים", "הגרזן",
    "משחיזת הגדומים", "משגיח הלוויתן", "הארגז", "די כבר", "תמונה של חלבה", "אוכלת יוגורט",
    "גנב הוויפיי", "אדון הספה", "זומבי קפאין", "דחיין מקצועי", "מפלצת הגרביים",
    "אלוף השתיקות המביכות", "זללן חצות", "חושב יותר מדי", "אוגר החטיפים", "פלמינגו הדרמה"
  ],
  [Language.AR]: [
    "المهرج", "الكابتن النسيّان", "سير ضحكة", "البروفيسور بودنغ", "العميل المشاغب",
    "دوق الشخبطة", "السيدة متمتمة", "الهامس الغامض", "الرجل الحديدي", "الدوق",
    "الدوقة", "الملك", "حلوى الجيلي", "بسكويت جاف", "حمص",
    "مدمر البيتزا", "نبي الكرواسون", "المختبئ بالثلاجة", "حصان المكرونة", "السيد توست",
    "مراقب الملاعق", "حارس القطط", "طاوية المناشف", "شامة المناديل", "الفأس",
    "شاحذة الجذوع", "مراقب الحوت", "الصندوق الكرتوني", "كفى خلاص", "صورة الحلاوة", "آكل الزبادي",
    "سارق الواي فاي", "سيد الأريكة", "زومبي الكافيين", "المماطل المحترف", "وحش الجوارب",
    "سيد الصمت المحرج", "مفترس منتصف الليل", "المفكر الزائد", "مكنز الوجبات الخفيفة", "فلامنغو الدراما"
  ],
  [Language.PT]: [
    "O Bobo", "Capitão Esquecido", "Sir Risadinha", "Professor Pudim", "Agente Trapalhão",
    "Duque dos Rabiscos", "Senhora Resmunga", "O Sussurrador Misterioso", "O Homem de Ferro", "O Duque",
    "A Duquesa", "O Rei", "Bala de Goma", "Biscoito Seco", "Homus",
    "Destruidor de Pizza", "Profeta do Croissant", "Escondido na Geladeira", "Cavalo de Macarrão", "Senhor Torrada",
    "Inspetor de Colheres", "Supervisor de Gatos", "Dobradora de Toalhas", "Farejador de Lenços", "O Machado",
    "Afiadora de Troncos", "Observador de Baleias", "A Caixa de Papelão", "Chega Já", "Foto de Halva", "Comedor de Iogurte",
    "Ladrão de Wi-Fi", "Senhor do Sofá", "Zumbi da Cafeína", "Procrastinador Profissional", "Monstro das Meias",
    "Mestre dos Silêncios Estranhos", "Comilão da Meia-Noite", "O Pensador Excessivo", "Acumulador de Lanches", "O Flamingo Dramático"
  ],
  [Language.HI]: [
    "जोकर", "कैप्टन भुलक्कड़", "सर हंसी", "प्रोफेसर पुडिंग", "एजेंट नौटंकी",
    "डूडल का नवाब", "बड़बड़ाने वाली देवी", "रहस्यमयी फुसफुसाहट", "आयरन मैन", "नवाब साहब",
    "बेगम साहिबा", "राजा जी", "रसमलाई", "सूखा पापड़", "छोले भटूरे",
    "पिज्जा का काल", "समोसा बाबा", "फ्रिज का भूत", "मैगी का घोड़ा", "मिस्टर टोस्ट",
    "चम्मच निरीक्षक", "बिल्ली रक्षक", "तौलिया मोड़ने वाला", "वाइप्स सूंघने वाला", "कुल्हाड़ी",
    "पेड़ तराशने वाला", "व्हेल रक्षक", "खाली डिब्बा", "बस भी करो", "हलवे की तस्वीर", "दही लवर",
    "वाई-फाई चोर", "सोफे का राजा", "कैफीन ज़ोंबी", "महा आलसी", "मोज़ा राक्षस",
    "सन्नाटे का उस्ताद", "आधी रात का भुक्कड़", "ओवरथिंकर", "स्नैक्स का तिजोरी", "ड्रामा फ्लेमिंगो"
  ],
  [Language.ID]: [
    "Sang Pelawak", "Kapten Pelupa", "Sir Cekikikan", "Profesor Puding", "Agen Kocak",
    "Adipati Coretan", "Nyonya Bergumam", "Pembisik Misterius", "Manusia Besi", "Sang Adipati",
    "Sang Putri Adipati", "Sang Raja", "Permen Kenyal", "Biskuit Kering", "Saus Hummus",
    "Penghancur Pizza", "Nabi Roti Croissant", "Sembunyi di Kulkas", "Kuda Mi Rebus", "Tuan Roti Bakar",
    "Pengawas Sendok", "Pengawas Kucing", "Pelipat Handuk", "Pencium Tisu Basah", "Si Kapak",
    "Pengasah Tunggul", "Penjaga Paus", "Kotak Kardus", "Sudah Cukup Dong", "Foto Manisan Halva", "Pemakan Yogurt",
    "Pencuri Wi-Fi", "Raja Sofa", "Zombi Kafein", "Penunda Profesional", "Monster Kaus Kaki",
    "Master Keheningan Canggung", "Pemangsa Tengah Malam", "Si Pemikir Berat", "Penimbun Camilan Darurat", "Flamingo Drama"
  ],
  [Language.ZH]: [
    "滑稽小丑", "健忘船长", "嘻嘻先生", "布丁教授", "糊涂特工",
    "涂鸦公爵", "咕哝女士", "神秘耳语者", "钢铁侠", "公爵大人",
    "公爵夫人", "国王陛下", "软糖糖", "干瘪饼干", "鹰嘴豆泥",
    "披萨终结者", "可颂预言家", "躲在冰箱里", "意大利面神马", "吐司先生",
    "勺子总管", "猫咪督察员", "折毛巾专家", "湿巾嗅探员", "绝命大板斧",
    "磨树桩达人", "观鲸守护者", "空纸箱子", "差不多得了", "哈尔瓦糖照片", "炫酸奶达人",
    "WiFi盗贼", "沙发之王", "咖啡因丧尸", "拖延症晚期", "袜子怪兽",
    "尬聊冷场王", "半夜偷吃狂", "脑补过度狂", "应急零食松鼠", "戏精火烈鸟"
  ]
};

export const TURN_CHAOS_EVENTS: () => TurnChaosEvent[] = () => [
    { type: TurnChaosType.SHORT_TURN, descriptionKey: 'turnChaosShortTurn', value: 30 },
    { type: TurnChaosType.SOUNDS_AND_MIME, descriptionKey: 'turnChaosSoundsAndMime' },
    { type: TurnChaosType.QUESTIONS_ONLY, descriptionKey: 'turnChaosQuestionsOnly' },
    { type: TurnChaosType.RUSSIAN_ACCENT, descriptionKey: 'turnChaosRussianAccent' },
    { type: TurnChaosType.FRENCH_ACCENT, descriptionKey: 'turnChaosFrenchAccent' },
    { type: TurnChaosType.BEAR_ACCENT, descriptionKey: 'turnChaosBearAccent' },
    { type: TurnChaosType.BREAKING_NEWS, descriptionKey: 'turnChaosBreakingNews' },
];

export const createMinigameDeck = (): MinigameCard[] => {
  const deck: MinigameCardOutcome[] = [
    { action: MinigameCardActionType.BONUS_POINTS, value: 3, translationKey: 'cardOutcomeBonusPoints' },
    { action: MinigameCardActionType.LOSE_POINTS, value: 2, translationKey: 'cardOutcomeLosePoints' },
    { action: MinigameCardActionType.STEAL_POINTS, value: 2, translationKey: 'cardOutcomeStealPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSteal' },
    { action: MinigameCardActionType.SWAP_SCORES, value: 0, translationKey: 'cardOutcomeSwapScores', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSwap' },
    { action: MinigameCardActionType.BONUS_POINTS, value: 2, translationKey: 'cardOutcomeBonusPoints' },
    { action: MinigameCardActionType.LOSE_POINTS, value: 1, translationKey: 'cardOutcomeLosePoints' },
    
    // Core Cards
    { action: MinigameCardActionType.DOUBLE_POINTS, value: 0, translationKey: 'cardOutcomeDoublePoints' },
    { action: MinigameCardActionType.DOUBLE_TARGET_POINTS, value: 0, translationKey: 'cardOutcomeDoubleTargetPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceDoublePoints' },
    { action: MinigameCardActionType.RANDOMIZE_SCORES, value: 0, translationKey: 'cardOutcomeRandomizeScores' },
    { action: MinigameCardActionType.LOSE_HALF_POINTS, value: 0, translationKey: 'cardOutcomeLoseHalfPoints' },
    { action: MinigameCardActionType.GIVE_POINTS, value: 3, translationKey: 'cardOutcomeGivePoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceGivePoints' },

    // Fresh Chaos Cards
    { action: MinigameCardActionType.ROBIN_HOOD, value: 2, translationKey: 'cardOutcomeRobinHood' },
    { action: MinigameCardActionType.UNDERDOG_SURGE, value: 4, translationKey: 'cardOutcomeUnderdogSurge' },
    { action: MinigameCardActionType.TAX_COLLECTOR, value: 1, translationKey: 'cardOutcomeTaxCollector' },
    { action: MinigameCardActionType.THE_EQUALIZER, value: 0, translationKey: 'cardOutcomeTheEqualizer' },
    { action: MinigameCardActionType.DOUBLE_OR_NOTHING, value: 5, translationKey: 'cardOutcomeDoubleOrNothing' },
    { action: MinigameCardActionType.RUSSIAN_ROULETTE, value: 3, translationKey: 'cardOutcomeRussianRoulette', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceRoulette' },
    { action: MinigameCardActionType.MYSTERY_BOX, value: 0, translationKey: 'cardOutcomeMysteryBox' },
  ];
  return shuffleArray(deck).map(outcome => ({ id: generateId(), outcome }));
};

/**
 * Determines if a chaos event should occur between turns and modifies the session state accordingly.
 * @param currentSession The current game session.
 * @returns A new game session object, possibly modified with a chaos event.
 */
export const handleBetweenTurnChaos = (currentSession: GameSession): GameSession => {
    if (!currentSession.isChaosMode) return currentSession;
  
    let sessionCopy = { ...currentSession, activeChaosEvent: null, activeTurnChaos: null };
    const chaosRoll = Math.random();
  
    if (chaosRoll < 0.25) { // 25% chance for Turn Modifier
      const turnChaosOptions = TURN_CHAOS_EVENTS();
      sessionCopy.activeTurnChaos = shuffleArray(turnChaosOptions)[0];
      sessionCopy.activeChaosEvent = ChaosEvent.TURN_MODIFIER;
      return sessionCopy;
    }
    
    else if (chaosRoll < 0.50) { // 25% chance for Minigame (total 50% chaos chance)
      const minigamePlayerIndex = sessionCopy.currentPlayerIndex;
      // FIX: Get the player ID from the playerOrder array using the index. The Player object itself doesn't have an `id` property.
      const activePlayerId = sessionCopy.playerOrder[minigamePlayerIndex];
      const fullDeck = createMinigameDeck();
  
      sessionCopy.minigameState = {
        isActive: true,
        activePlayerId: activePlayerId,
        cards: fullDeck.slice(0, MINIGAME_CARDS_TO_DRAW),
        selectedCardId: null, revealedOutcome: null, actionApplied: false,
      };
      sessionCopy.gameState = GameState.MINIGAME;
      sessionCopy.activeChaosEvent = ChaosEvent.MINIGAME_TRIGGER;
      return sessionCopy;
    }
    
    return sessionCopy; // No chaos event this time
};