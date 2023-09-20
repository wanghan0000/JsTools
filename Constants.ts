/**方块大小 */
export const BlockWidth = 120;
/**棋盘最大行 */
export const MaxRow = 8;
/**棋盘最大列 */
export const MaxColumns = 5;
/**一个格子的缓动时间 */
export const BlockTweenInterval = .03
/**合并缓动时间 */
export const MergeBlockTweenTime =  .15

export const GAME_WUJING = 'GAME_WUJING'
export const GAME_TIAOZHAN = 'GAME_TIAOZHAN'
export const GAME_MAX_SCORE = 'GAME_MAX_SCORE'

export const PointsX = [60,195,332,471,608] 

export const MaxBlockScore = 32768
/**分数权重 */
export const Weights = [
    {
        score: 200,
        rule: [
            { block: 2, weight: 75 },
            { block: 4, weight: 55 },
            { block: 8, weight: 45 },
        ]
    },
    {
        score: 1000,
        rule: [
            { block: 2, weight: 70 },
            { block: 4, weight: 50 },
            { block: 8, weight: 40 },
            { block: 16, weight: 2 },
        ]
    }, {
        score: 5000,
        rule: [
            { block: 2, weight: 65 },
            { block: 4, weight: 45 },
            { block: 8, weight: 35 },
            { block: 16, weight: 5 },
        ]
    }, {
        score: 10000,
        rule: [
            { block: 2, weight: 60 },
            { block: 4, weight: 40 },
            { block: 8, weight: 30 },
            { block: 16, weight: 5 },
            { block: 32, weight: 1 },
        ]
    }, {
        score: 20000,
        rule: [
            { block: 2, weight: 55 },
            { block: 4, weight: 35 },
            { block: 8, weight: 25 },
            { block: 16, weight: 5 },
            { block: 32, weight: 5 },
            { block: 64, weight: 1 },
        ]
    }, {
        score: 50000,
        rule: [
            { block: 2, weight: 50 },
            { block: 4, weight: 30 },
            { block: 8, weight: 20 },
            { block: 16, weight: 5 },
            { block: 32, weight: 5 },
            { block: 64, weight: 1 },
            { block: 128, weight: 1 },
        ]
    }, {
        score: 100000,
        rule: [
            { block: 2, weight: 45 },
            { block: 4, weight: 25 },
            { block: 8, weight: 15 },
            { block: 16, weight: 5 },
            { block: 32, weight: 5 },
            { block: 64, weight: 1 },
            { block: 128, weight: 1 },
            { block: 256, weight: 1 },
        ]
    }, {
        score: 200000,
        rule: [
            { block: 2, weight: 40 },
            { block: 4, weight: 20 },
            { block: 8, weight: 15 },
            { block: 16, weight: 15 },
            { block: 32, weight: 5 },
            { block: 64, weight: 1 },
            { block: 128, weight: 1 },
            { block: 256, weight: 1 },
        ]
    }
]