import { _decorator, Component, Label, Node, resources, Sprite, SpriteFrame } from 'cc';
import { MaxBlockScore, MaxColumns } from '../Constants';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    /**左侧方块 */
    public left: any;
    /**右侧方块 */
    public right: any;
    /**顶部方块 */
    public top: any;
    /**底部方块 */
    public bottom: any;

    public _score: number;
    public set score(v: number) {
        this._score = v;
        if (v <= MaxBlockScore) {
            resources.load(`texture/${v}/spriteFrame`, SpriteFrame, (err, sp) => {
                if (!err) {
                    this.bg.spriteFrame = sp
                }
            })
            this.isStone = false; 
        } else {
            resources.load(`texture/stone/spriteFrame`, SpriteFrame, (err, sp) => {
                if (!err) {
                    this.bg.spriteFrame = sp
                }
            })
            this.isStone = true;
        }
    }
    public get score(): number {
        return this._score
    }

    public isStone: boolean = false;


    @property(Sprite)
    bg: Sprite = null;

    public row: number;  //行
    public column: number; //列
    private _index: number;
    public set index(val: number) {
        this._index = val;
        this.row = Math.floor(val / MaxColumns)
        this.column = val % MaxColumns;
    }
    public get index(): number {
        return this._index;
    }
    distance
    mark
    targetIndex

}

