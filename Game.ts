import { _decorator, Component, Node, Prefab, Tween, UITransform, v3, tween, Label, director, ProgressBar, JsonAsset } from 'cc';
import { PoolManager } from './PoolManager';
import { Block } from './compoents/Block';
import { BlockTweenInterval, BlockWidth, GAME_MAX_SCORE, GAME_TIAOZHAN, GAME_WUJING, MaxColumns, MaxRow, MergeBlockTweenTime, PointsX, Weights } from './Constants';
import { MyStorage } from './localstorge';
const { ccclass, property } = _decorator;



@ccclass('Game')
export class Game extends Component {

    /**方块预制体 */
    @property(Prefab)
    blockPrefab: Prefab = null;
    /**棋盘 */
    @property(Node)
    blockBoard: Node = null;
    /**下一个棋子 */
    @property(Block)
    nextBlock: Block = null;

    @property(Label)
    scoreText: Label = null;
    @property(Label)
    scoreText2: Label = null;
    @property(Label)
    scoreText3: Label = null;
    @property(Label)
    text1: Label = null;
    /**使用步数 */
    @property(Label)
    text2: Label = null;
    /**挑战模式 */
    @property(Node)
    MododesafioNode: Node = null;
    @property(Node)
    wujingNode: Node = null;

    @property(Node)
    gameOver: Node = null;
    /**通关节点 */
    @property(Node)
    successNode: Node = null
    @property(JsonAsset)
    gameJson: JsonAsset = null;
    private blocks: Node[] = [];
    /**玩家分数 */
    private _playerScore: number = 0;
    public set playerScore(v: number) {
        this._playerScore = v;
        this.scoreText.string = `${v}`
        this.scoreText2.string = `${v}`
        this.scoreText3.string = `${v}`
    }
    public get playerScore(): number {
        return this._playerScore
    }
    /**玩家使用步数 */
    private _playerStep: number = 0;
    public set playerStep(v: number) {
        this._playerStep = v;
        this.text2.string = `${v}  `
    }
    public get playerStep(): number {
        return this._playerStep;
    }

    private nextScore: number;

    private testIndex = 0;
    private testNum = []

    private boardDatas = [];

    private isShooting = false;

    private customParams;
    /**剩余步数 */
    private _remainingSteps: number = 0;
    public get remainingSteps(): number {
        return this._remainingSteps;
    }
    public set remainingSteps(v: number) {
        this._remainingSteps = v;
        this.text2.string = `${v}  `
    }



    start() {
        this.customParams = (director.getScene() as any).customParams
        this.gameInit()
        console.log(this.customParams)
    }

    initBord(data, isLevel = true) {
        if (isLevel) {
            data.forEach(({ row, col, val }) => {
                const index = row * MaxColumns + col;
                const blockNode = PoolManager.instance.getNode(this.blockPrefab, this.blockBoard)
                const block = blockNode.getComponent(Block)
                block.index = index;
                const startX =  PointsX[block.column]
                blockNode.position = v3(startX, -row * BlockWidth - BlockWidth / 2, 0)
                this.boardDatas[index] = block;
                this.blocks.push(blockNode)
            
                block.score = val
            })
        } else {
            data.forEach((v, index) => {
                if (v) {
                    const blockNode = PoolManager.instance.getNode(this.blockPrefab, this.blockBoard)
                    const block = blockNode.getComponent(Block)
                    const col = index % MaxColumns;
                    const row = Math.floor(index / MaxColumns)
                    const startX = PointsX[col]
                    blockNode.position = v3(startX, -row * BlockWidth - BlockWidth / 2, 0)
                    this.boardDatas[index] = block;
                    this.blocks.push(blockNode)
                    block.index = index;
                    block.score = v
                }
            })
        }
        this.handleTree()
    }

    /**点击发射方块 */
    onClickShootingBlock(v) {
        if (this.isShooting) {
            return
        }
        if (this.customParams) {
            this.remainingSteps -= 1;
        } else {
            this.playerStep += 1;
        }

        this.isShooting = true
        const locationPoint = v.touch?.getUILocation();
        const point = v.target.getComponent(UITransform).convertToNodeSpaceAR(v3(locationPoint.x, locationPoint.y, 0))
        let track = 0;
        for (let i = 0; i < MaxColumns; ++i) {
            if (point.x < 140 * (i + 1)) {
                track = i;
                break
            }
        }
        const blockNode = PoolManager.instance.getNode(this.blockPrefab, this.blockBoard)
        const block = blockNode.getComponent(Block)
        block.top = null
        block.bottom = null
        block.left = block.right = null;
        block.mark = false;
        block.distance = 0;
        block.score = this.nextScore;
        const startX =  PointsX[track]
        blockNode.position = v3(startX, -this.blockBoard.getComponent(UITransform).contentSize.height, 0)
        let targetPoint;
        let duration;
        let row = 0;
        /**获取某一列顶部的方块 */
        const topBlock = this.getTopBlock(track);
        if (!topBlock) {
            /**直接到底部 */
            targetPoint = v3(startX, -BlockWidth / 2, 0);
            duration = BlockTweenInterval * MaxRow;
        } else {
            /**停靠到目标方块的上一格 */
            targetPoint = v3(startX, -((topBlock.row + 1) * BlockWidth + BlockWidth / 2));
            duration = BlockTweenInterval * (MaxRow - (topBlock.row + 1))
            row = topBlock.row + 1;
        }
        /**缓动到目标位置 */
        tween<Node>(blockNode).to(duration, {
            position: targetPoint
        }, { easing: 'linear' }).call(() => {
            /**节点数据整理 */
            const index = track + row * MaxColumns;
            block.index = index;
            this.blocks.push(blockNode);
            this.boardDatas[index] = block;
            this.handleTree();
            /**合并 */
            this.mergeBlock(block, () => {
                //console.log('合并结束了===============')
                this.isShooting = false;
                let isDeath = false;
                let isSaveBoard = true;
                if (this.customParams) {
                    //闯关 则检测分数是否满足
                    const { targetScore } = this.customParams;
                    if (this.playerScore >= targetScore) {
                        //播放通关界面
                        this.successNode.active = true;
                    } else if (this.remainingSteps === 0) {
                        //失败
                        this.gameOver.active = true
                        isSaveBoard = false;
                    } else {
                        isDeath = this.deathCheck()
                    }
                } else {
                    isDeath = this.deathCheck()
                    const maxscore = MyStorage.getItem(GAME_MAX_SCORE, false)
                    if (maxscore) {
                        if (this.playerScore > parseInt(maxscore)) {
                            MyStorage.setItem(GAME_MAX_SCORE, this.playerScore, false)
                        }
                    } else {
                        MyStorage.setItem(GAME_MAX_SCORE, this.playerScore, false)
                    }
                }
                if (isDeath) {
                    this.gameOver.active = true
                    isSaveBoard = false;
                }
                const boardDatas = [];
                this.boardDatas.forEach((v, index) => {
                    if (index < MaxColumns * MaxRow) {
                        if (v as Block) {
                            boardDatas.push(v.score)
                        } else {
                            boardDatas.push(0)
                        }
                    }
                })

                if (isSaveBoard) {
                    //存储当前数据
                    if (this.customParams) {
                        const key = `${GAME_TIAOZHAN}${this.customParams.level}`
                        const prvData = MyStorage.getItem(key)
                        if (prvData) {
                            //重复挑战 只更新棋盘数据 
                            MyStorage.setItem(key, {
                                ...prvData,
                                score: this.playerScore,
                                step: this.remainingSteps,
                                boardDatas: boardDatas
                            })
                        } else {
                            MyStorage.setItem(key, {
                                boardDatas: boardDatas,
                                score: this.playerScore,
                                step: this.remainingSteps
                            })
                        }
                        if (this.successNode.active) {
                            //通关了
                            const maxLevel = MyStorage.getItem('maxLevel', false) || 0
                            if (this.customParams.level > parseInt(maxLevel)) {
                                MyStorage.setItem('maxLevel', this.customParams.level, false)
                            }
                            MyStorage.setItem(key, {
                                unlock: true,
                            })
                        }
                    } else {
                        MyStorage.setItem(GAME_WUJING, {
                            boardDatas: boardDatas,
                            score: this.playerScore,
                            step: this.playerStep
                        })
                    }
                } else {
                    //清空当前数据
                    if (this.customParams) {
                        const key = `${GAME_TIAOZHAN}${this.customParams.level}`
                        const prvData = MyStorage.getItem(key)
                        if (prvData) {
                            //重复挑战 只清空棋盘数据 
                            MyStorage.setItem(key, {
                                ...prvData,
                                boardDatas: undefined,
                                score: 0,
                                step: this.customParams.step
                            })
                        }
                    } else {
                        MyStorage.removeItem(GAME_WUJING)
                    }


                }
            })
        }).start();

        this.createNextBlock()
    }

    /**死亡检测 */
    deathCheck(): boolean {
        if (this.boardDatas.length > MaxColumns * MaxRow) {
            let statImdex = MaxColumns * MaxRow
            for (let i = statImdex; i < this.boardDatas.length; ++i) {
                if (this.boardDatas[i] as Block) {
                    return true;
                }
            }
        }
        return false;
    }

    /**创建下一个预显示方块 */
    createNextBlock() {
        if (this.testIndex < this.testNum.length) {
            this.nextScore = this.testNum[this.testIndex];
            this.nextBlock.score = this.testNum[this.testIndex]
            this.testIndex += 1;
        } else {
            const blockScore = this.randomBlockScore()
            this.nextScore = blockScore;
            this.nextBlock.score = blockScore
        }
    }

    mergeBlock(bullet: Block, completet) {
        const blocks = [];
        function findBlock(block: Block, bullet: Block, type: number) {
            if (!block) {
                return
            }
            if(block.isStone){
                return
            }
            if (type === 1) {
                /**左侧 */
                if (block.score === bullet.score) {
                    blocks.push(block);
                    findBlock(block.left, bullet, type)
                    findBlock(block.top, bullet, type)
                }
            } else if (type === 2) {
                /**右侧 */
                if (block.score === bullet.score) {
                    blocks.push(block);
                    findBlock(block.right, bullet, type)
                    findBlock(block.top, bullet, type)
                }
            } else if (type === 3) {
                if (block.score === bullet.score) {
                    blocks.push(block);
                    findBlock(block.top, bullet, type)
                }
            }
        }
        findBlock(bullet.left, bullet, 1);
        findBlock(bullet.right, bullet, 2);
        findBlock(bullet.top, bullet, 3);
        if (!blocks.length) {
            const nextBlock = this.moveDownBlocks.shift()
            if (nextBlock) {
                this.mergeBlock(nextBlock, completet)
            } else {
                completet()
            }
        } else {
            /**剔除相同的blocks */
            const uniqueBlocks: Block[] = [];
            const ids: any = []
            for (const item of blocks) {
                if (!ids.includes(item.index)) {
                    uniqueBlocks.push(item);
                    ids.push(item.index)
                }
            }
            /**开始合并动画 */
            const targetPoint = bullet.node.position;
            let isFinish = 0;
            for (const item of uniqueBlocks) {
                this.blocks = this.blocks.filter(element => element.getComponent(Block).index !== item.index)
                this.moveDownBlocks = this.moveDownBlocks.filter(element => element.getComponent(Block).index !== item.index)
                this.boardDatas[item.index] = 0;
                /**缓动到目标位置 */
                tween<Node>(item.getComponent(UITransform).node).to(MergeBlockTweenTime, {
                    position: targetPoint
                }, { easing: 'linear' }).call(() => {
                    isFinish += 1;
                    if (isFinish === uniqueBlocks.length) {
                        /**计算分数 */
                        let score = bullet.score;
                        for (let i = 0; i < uniqueBlocks.length; ++i) {
                            score += score;
                        }
                        this.playerScore += score;
                        bullet.score = score;
                        
                        this.moveBlock(() => {
                            this.pushMoveDownBlocks(bullet)
                            //所有棋子下落完成
                            /**获取最底部的棋子来进行合并 */
                            // let nextBullet = null;
                            // for(let i = 0 ; i < this.moveDownBlocks.length ; ++i){
                            //     if(!nextBullet){
                            //         nextBullet = this.moveDownBlocks[i]
                            //     }else {
                            //         if(this.moveDownBlocks[i].row < nextBullet.row){
                            //             nextBullet = this.moveDownBlocks[i];
                            //         }
                            //     }
                            // }
                            // for(let i = 0 ; i < this.moveDownBlocks.length ; ++i){
                            //     if(this.moveDownBlocks[i].index === bullet.index){
                            //         this.moveDownBlocks.splice(i,1);
                            //         break
                            //     }
                            // }
                            const nextBlock = this.moveDownBlocks.pop()
                            this.mergeBlock(nextBlock, completet)
                        })
                    }
                    PoolManager.instance.putNode(item.getComponent(UITransform).node);
                }).start();
            }
            this.handleTree()
        }
    }



    moveBlockBottom() {
        const allBlocks = [];
        //检测移动距离
        const findDistance = (block: Block) => {
            if (!block) {
                return
            }
            //找到自己的顶部
            const topBlock = this.getTopBlock(block.column, block)
            if (topBlock) {
                block.distance = block.row - (topBlock.row + 1);
            } else {
                block.distance = block.row;
            }
        }
        function findBottomBlock(block: Block, distance, blocks) {
            if (!block) {
                return
            }
            block.distance = distance;
            block.mark = true;
            blocks.push(block)
            findBottomBlock(block.bottom, distance, blocks);
        }
        this.boardDatas.forEach((v) => {
            const block = v as Block;
            if (block) {
                block.mark = false;
            }
        })
        this.boardDatas.forEach((v) => {
            const block = v as Block;
            if (block && block.top === 0 && !block.mark) {
                findDistance(block)
                const blocks: Block[] = [];
                const distance = block.distance;
                findBottomBlock(block, distance, blocks)
                blocks.forEach((v) => {
                    v.targetIndex = v.index - v.distance * MaxColumns;
                    allBlocks.push(v)
                })
            }
        })
        return allBlocks;
    }

    private moveDownBlocks: Block[] = [];

    pushMoveDownBlocks(block) {
        let isPush = true;
        for (let i = 0; i < this.moveDownBlocks.length; ++i) {
            if (this.moveDownBlocks[i] === block) {
                isPush = false;
                break
            }
        }
        if (isPush) {
            this.moveDownBlocks.push(block)
        }
    }
    moveBlock(completet) {
        //获取所有要移动的block
        const blocks: Block[] = this.moveBlockBottom()
        //将所有的下落棋子放入
        blocks.forEach((v) => {
            this.pushMoveDownBlocks(v)
        })
        //开始播放下落动画
        let moveFinish = 0;
        blocks.forEach((element) => {
            const node = element.getComponent(UITransform).node;
            tween<Node>(node).to(MergeBlockTweenTime, {
                position: v3(node.position.x, node.position.y + element.distance * BlockWidth, 0)
            }, { easing: 'linear' }).call(() => {
                moveFinish += 1;
                if (moveFinish === blocks.length) {
                    blocks.forEach((v) => {
                        this.boardDatas[v.targetIndex] = v;
                        this.boardDatas[v.index] = 0;
                        v.index = v.targetIndex;
                        v.targetIndex = undefined;
                        v.distance = 0;
                    })
                    this.handleTree()
                    completet()
                }

            }).start()
        })
        if (!blocks.length) {
            completet()
        }
    }

    handleTree() {
        const datas = this.boardDatas;
        for (let i = 0; i < datas.length; ++i) {
            let block = datas[i] as Block;
            if (block) {
                block.left = null;
                block.right = null;
                block.top = null;
                block.bottom = null;

                let leftIndex = -1;
                let rightIndex = -1;
                let topIndex = -1;
                let bottomIndex = -1;
                if (i % MaxColumns !== 0) {
                    leftIndex = i - 1;
                }
                if (i % MaxColumns !== MaxColumns - 1) {
                    rightIndex = i + 1;
                }
                if (i - MaxColumns >= 0) {
                    topIndex = i - MaxColumns;
                }
                if (i + MaxColumns < datas.length) {
                    bottomIndex = i + MaxColumns;
                }
                block.left = datas[leftIndex];
                block.right = datas[rightIndex];
                block.top = datas[topIndex];
                block.bottom = datas[bottomIndex];
            }
        }
    }

    getTopBlock(column: number, self?: Block): Block | null {
        let block: Block = null;
        for (let i = 0; i < this.blocks.length; ++i) {
            const tmpBlock = this.blocks[i].getComponent(Block);
            if (tmpBlock.column === column) {
                if (!block) {
                    if (self && self.index !== tmpBlock.index) {
                        if (tmpBlock.row < self.row)
                            block = tmpBlock;
                    } else if (self) {
                        if (tmpBlock.row < self.row)
                            block = tmpBlock;
                    }
                    else if (!self) {
                        block = tmpBlock;
                    }
                } else if (block.row < tmpBlock.row) {
                    if (self && self.index !== tmpBlock.index) {
                        if (tmpBlock.row < self.row)
                            block = tmpBlock;
                    } else if (self) {
                        if (tmpBlock.row < self.row)
                            block = tmpBlock;
                    }
                    else if (!self) {
                        block = tmpBlock;
                    }

                }
            }
        }
        return block;
    }

    getBlockByIndex(index: number): Block | null {
        let block: Block = null;
        for (let i = 0; i < this.blocks.length; ++i) {
            const tmpBlock = this.blocks[i].getComponent(Block);
            if (tmpBlock.index === index) {
                block = tmpBlock;
                break;
            }
        }
        return block;
    }

    /**随机方块分数 */
    randomBlockScore(): number {
        let rule: any = Weights[Weights.length - 1].rule;
        for (let i = 0; i < Weights.length; ++i) {
            if (this.playerScore < Weights[i].score) {
                rule = Weights[i].rule
                break
            }
        }
        //console.log(rule)
        let totalWeight = 0;
        rule.map((element, index) => {
            totalWeight += element.weight
            if (index > 0) {
                element.startW = rule[index - 1].endW;
                element.endW = totalWeight;
            } else {
                element.startW = 0;
                element.endW = element.weight
            }
        })
        const random = Math.ceil(Math.random() * totalWeight)
        const select = rule.find(element => element.startW <= random && element.endW >= random)
        return select.block
    }

    /**棋盘重置 */
    boardReset() {
        this.blocks.forEach((v) => {
            PoolManager.instance.putNode(v)
        })
        this.blocks.length = 0;
        this.boardDatas.length = MaxColumns * MaxRow
        this.boardDatas.fill(0, 0, MaxColumns * MaxRow)
    }
    /**游戏初始化 */
    gameInit() {
        this.boardReset()
        this.playerScore = 0;
        if (this.customParams) {
            this.remainingSteps = this.customParams.step;
            this.MododesafioNode.active = true;
            this.wujingNode.active = false;
        } else {
            this.playerStep = 0;
            this.MododesafioNode.active = false;
            this.wujingNode.active = true;
        }
        if (this.customParams) {
            const { step, startBlock, bordData, targetScore, level } = this.customParams;
            const key = `${GAME_TIAOZHAN}${level}`
            const prvData = MyStorage.getItem(key)
            let boardDatas = [...bordData]
            let remainingSteps = step
            let score = 0;
            let startBlockData = [...startBlock]
            if (prvData && prvData.boardDatas) {
                boardDatas = [...prvData.boardDatas]
                remainingSteps = prvData.step
                score = prvData.score;
                startBlockData = []
                /**创建初始棋盘 */
                this.initBord(boardDatas, false)
            } else {
                /**创建初始棋盘 */
                this.initBord(boardDatas, true)
            }

            this.remainingSteps = remainingSteps;
            this.playerScore = score;
            this.testNum = [...startBlockData]
            this.testIndex = 0;
            this.text1.string = `Pontuação do alvo ${targetScore}`
        } else {
            const prvData = MyStorage.getItem(GAME_WUJING)
            if (prvData) {
                this.initBord(prvData.boardDatas, false)
                this.playerScore = prvData.score;
                this.playerStep = prvData.step;
            }
        }
        this.createNextBlock()
    }

    /**游戏重置 */
    gameReset() {
        this.boardReset()
        this.gameOver.active = false;
        this.successNode.active = false;
        if (this.customParams) {
            this.remainingSteps = this.customParams.step;
        } else {
            this.playerStep = 0;
        }
        this.playerScore = 0;
        if (this.customParams) {
            const { step, startBlock, bordData, targetScore, level } = this.customParams;
            /**闯关模式 */
            //this.text1.string = `${step[0]}步以内获得${targetScore}分3星通关`
            this.testNum = [...startBlock]
            this.testIndex = 0;
            /**创建初始棋盘 */
            this.initBord(bordData)
            this.remainingSteps = step;
            this.text1.string = `Pontuação do alvo ${targetScore}`
        }
        this.createNextBlock()
        //清空当前数据
        if (this.customParams) {
            const key = `${GAME_TIAOZHAN}${this.customParams.level}`
            const prvData = MyStorage.getItem(key)
            if (prvData) {
                //重复挑战 只清空棋盘数据 
                MyStorage.setItem(key, {
                    ...prvData,
                    boardDatas: undefined,
                    score: 0,
                    step: this.customParams.step
                })
            }
        } else {
            MyStorage.removeItem(GAME_WUJING)
        }
    }

    /**回到首页 */
    goHome() {
        director.loadScene('startScenen')
    }

    /**下一关 */
    nextLevel() {
        const jsonData: any = this.gameJson.json;
        let level = this.customParams.level
        level += 1;
        if (level <= jsonData?.length) {
            this.customParams = jsonData[level - 1];
        }
        this.gameReset()
    }
}