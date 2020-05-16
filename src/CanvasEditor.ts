import {fabric} from 'fabric';
import { Canvas as FabricCanvas } from 'fabric/fabric-impl';

type WinSize = {
    w: number;
    h: number;
};

type MapFilterIndexType = Record<string, number>;

const coverImg = (img: HTMLImageElement, 
                  ctx: CanvasRenderingContext2D,
                  win: WinSize,
                  type = 'cover') => {
    const imgRatio = img.height / img.width
    const winRatio = window.innerHeight / window.innerWidth
    if ((imgRatio < winRatio && type === 'contain') || (imgRatio > winRatio && type === 'cover')) {
        const h = window.innerWidth * imgRatio
        ctx.drawImage(img, 0, (window.innerHeight - h) / 2, window.innerWidth, h)
    }
    if ((imgRatio > winRatio && type === 'contain') || (imgRatio < winRatio && type === 'cover')) {
        const w = window.innerWidth * winRatio / imgRatio
        ctx.drawImage(img, (win.w - w) / 2, 0, w, window.innerHeight)
    }
}

export class CanvasEditor {
    editorHTMLDiv: HTMLDivElement;
    imageUrl: string;
    //canvasObject: HTMLCanvasElement;
    filterName2index: MapFilterIndexType;
    canvas: FabricCanvas;
    constructor(editorHTMLDiv: HTMLDivElement, imageUrl: string) {
        this.editorHTMLDiv = editorHTMLDiv;
        this.imageUrl = imageUrl;
        
        const htmlCanvas = document.createElement('canvas');
        htmlCanvas.id = "canvas"; 
        htmlCanvas.width=1440;
        htmlCanvas.height=740;
        const ctx = htmlCanvas.getContext("2d");
        this.editorHTMLDiv.appendChild(htmlCanvas);

        // const win: WinSize = {
        //     w: window.innerWidth,
        //     h: window.innerHeight,
        // }

        // const image = new Image();

        // const resize = () => {
        //     win.w = window.innerWidth
        //     win.h = window.innerHeight
        //     htmlCanvas.width = win.w
        //     htmlCanvas.height = win.h
        //     htmlCanvas.style.width = `${win.w}px`
        //     htmlCanvas.style.height = `${win.h}px - 60px`
        // }
        // const render = () => {
        //     ctx?.clearRect(0, 0, win.w, win.h)
        //     const type = 'cover'
        //     coverImg(image, 
        //              ctx as CanvasRenderingContext2D, 
        //              win,
        //              type)
        //     requestAnimationFrame(render)
        // }
        // const init = () => {
        //     resize()
        //     render()
        // }
        // image.onload = init
        // image.src = imageUrl;
        // window.addEventListener('resize', init)

        // FABRIC
        fabric.Object.prototype.transparentCorners = false;

        const canvas = new fabric.Canvas(htmlCanvas);
        const filters = fabric.Image.filters;
        this.canvas = canvas;
        this.filterName2index = {
            'grayscale': 0
        };
        fabric.Image.fromURL(imageUrl, function(img: fabric.Image) {
            if (img) {
                const imgRatio = (img.height || 1000) / (img.width || 1000)
                const winRatio = window.innerHeight / window.innerWidth
                if (imgRatio > winRatio) {
                    const h = window.innerWidth * imgRatio;
                    var oImg = img.set({ left: 0, top: 0}).scaleToHeight(h)
                    canvas.add(oImg);
                }
                if (imgRatio < winRatio) {
                    const w = window.innerWidth * winRatio / imgRatio;
                    var oImg = img.set({ left: 0, top: 0}).scaleToWidth(w);
                    canvas.add(oImg);
                }
            }
        });
    }

    applyFilter(filterName: string) {
        const f = fabric.Image.filters;
        const name2filter = {
            'grayscale': f.Grayscale,
        };
        const objects: fabric.Object[] = this.canvas.getObjects();
        if(objects.length > 0) {
            const obj = objects[0];
            const index: number = this.filterName2index[filterName];
            // @ts-ignore
            obj.filters[index] = new name2filter[filterName]();
            // @ts-ignore
            obj.applyFilters();
            this.canvas.renderAll();
        }
    }
}
