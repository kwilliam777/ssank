export interface Word {
    id: string;
    word: string;
    meaning: string;
    meaningKR: string;
    example: string;
    category?: 'Elementary' | 'Middle' | 'High';
}

export const vocabulary: Word[] = [
    { id: '1', word: 'Ambiguous', meaning: 'Open to more than one interpretation; having a double meaning.', meaningKR: '애매모호한, 여러 가지로 해석 가능한', example: 'The election result was ambiguous.', category: 'High' },
    { id: '2', word: 'Benevolent', meaning: 'Well meaning and kindly.', meaningKR: '자비로운, 인자한', example: 'A benevolent smile.', category: 'High' },
    { id: '3', word: 'Candid', meaning: 'Truthful and straightforward; frank.', meaningKR: '솔직한, 거리낌 없는', example: 'His responses were remarkably candid.', category: 'Middle' },
    { id: '4', word: 'Diligent', meaning: 'Having or showing care and conscientiousness in one\'s work or duties.', meaningKR: '근면한, 성실한', example: 'Many diligent researchers have already investigated this.', category: 'Middle' },
    { id: '5', word: 'Empathy', meaning: 'The ability to understand and share the feelings of another.', meaningKR: '감정 이입, 공감', example: 'He had great empathy for the poor.', category: 'Elementary' },
    { id: '6', word: 'Fortitude', meaning: 'Courage in pain or adversity.', meaningKR: '불굴의 용기', example: 'She endured her illness with great fortitude.', category: 'High' },
    { id: '7', word: 'Gratitude', meaning: 'The quality of being thankful; readiness to show appreciation for and to return kindness.', meaningKR: '감사', example: 'She expressed her gratitude to the committee.', category: 'Elementary' },
    { id: '8', word: 'Humble', meaning: 'Having or showing a modest or low estimate of one\'s own importance.', meaningKR: '겸손한', example: 'He was humble despite his wealth.', category: 'Elementary' },
    { id: '9', word: 'Inevitably', meaning: 'As is certain to happen; unavoidably.', meaningKR: '필연적으로, 반드시', example: 'Inevitably, some details are already out of date.', category: 'Middle' },
    { id: '10', word: 'Juxtapose', meaning: 'Place or deal with close together for contrasting effect.', meaningKR: '병렬하다, 나란히 놓다', example: 'Black-and-white photos of slums were juxtaposed with color images.', category: 'High' },
];
