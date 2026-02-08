export interface Word {
    id: string;
    word: string;
    meaning: string;
    example: string;
    category?: 'Elementary' | 'Middle' | 'High';
}

export const vocabulary: Word[] = [
    { id: '1', word: 'Ambiguous', meaning: 'Open to more than one interpretation; having a double meaning.', example: 'The election result was ambiguous.', category: 'High' },
    { id: '2', word: 'Benevolent', meaning: 'Well meaning and kindly.', example: 'A benevolent smile.', category: 'High' },
    { id: '3', word: 'Candid', meaning: 'Truthful and straightforward; frank.', example: 'His responses were remarkably candid.', category: 'Middle' },
    { id: '4', word: 'Diligent', meaning: 'Having or showing care and conscientiousness in one\'s work or duties.', example: 'Many diligent researchers have already investigated this.', category: 'Middle' },
    { id: '5', word: 'Empathy', meaning: 'The ability to understand and share the feelings of another.', example: 'He had great empathy for the poor.', category: 'Elementary' },
    { id: '6', word: 'Fortitude', meaning: 'Courage in pain or adversity.', example: 'She endured her illness with great fortitude.', category: 'High' },
    { id: '7', word: 'Gratitude', meaning: 'The quality of being thankful; readiness to show appreciation for and to return kindness.', example: 'She expressed her gratitude to the committee.', category: 'Elementary' },
    { id: '8', word: 'Humble', meaning: 'Having or showing a modest or low estimate of one\'s own importance.', example: 'He was humble despite his wealth.', category: 'Elementary' },
    { id: '9', word: 'Inevitably', meaning: 'As is certain to happen; unavoidably.', example: 'Inevitably, some details are already out of date.', category: 'Middle' },
    { id: '10', word: 'Juxtapose', meaning: 'Place or deal with close together for contrasting effect.', example: 'Black-and-white photos of slums were juxtaposed with color images.', category: 'High' },
];
