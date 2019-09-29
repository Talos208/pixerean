import React, {ChangeEvent, useRef} from 'react';
import './App.css';

interface IDotProps {
  x: number
  y: number
  dots: Uint8ClampedArray
}

function getColorCode(dots: ArrayLike<number>) {
  return '#' +
    dots[0].toString(16).padStart(2, '0') +
    dots[1].toString(16).padStart(2, '0') +
    dots[2].toString(16).padStart(2, '0');
}

const Dot = ({x, y, dots}: IDotProps) => {
  let col: string = getColorCode(dots)

  let style = {
    backgroundColor: col,
    opacity: dots[3] / 255,
  }
  return (<div className={'Dot'} style={style}/>)
}

interface IMatrixProps {
  width: number
  height: number
  drawing: boolean
  dots: Uint8ClampedArray
  setDots: React.Dispatch<React.SetStateAction<Uint8ClampedArray>>
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>
  penColor: TColor
  setPenColor: React.Dispatch<React.SetStateAction<TColor>>
}

const Matrix = ({width, height, dots, setDots, drawing, setDrawing, penColor, setPenColor}: IMatrixProps) => {
  const elemRef = useRef(null);

  const getElem = (): Element => {
    const elem: any = elemRef.current;

    return elem;
  };

  function dotsIndex(rect: DOMRect | ClientRect, x: number, y: number) {
    let dx = Math.floor((x - rect.left) / 16)
    let dy = Math.floor((y - rect.top) / 16)
    return (dy * width + dx) * 4;
  }

  const matrixDrawProc = (rect: DOMRect | ClientRect, x: number, y: number) => {
    let ix = dotsIndex(rect, x, y);
    // console.log(dx,dy,ix)
    if (ix >= 0 && ix < width * height * 4) {
      let nd = Uint8ClampedArray.from(dots)
      nd.set(toRgba(penColor), ix)
      setDots(nd)
    }
  }

  let mat: any[] = []
  for (let y = 0; y < height; y++) {
    let row: any[] = []
    for (let x = 0; x < width; x++) {
      let ix = (y * width + x) * 4;
      // @ts-ignore
      row.push((<Dot x={x} y={y} dots={dots.slice(ix)}/>))
    }
    mat.push((<div style={{height: '16px'}}>{row}</div>))
  }

  return (
    <div className={'Matrix'} ref={elemRef} style={{width: width * 16 + 'px'}}
         onContextMenu={(event) => {
           event.stopPropagation()
           event.preventDefault()
           return false
         }}
         onMouseDown={(event) => {
           event.stopPropagation()
           event.preventDefault()
           if (event.button === 2) {
             let ix = dotsIndex(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY)
             setPenColor(fromRbg(dots.subarray(ix)))
             return
           }
           matrixDrawProc(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY)
           setDrawing(true)
         }}
         onMouseMove={(event) => {
           if (drawing) {
             event.stopPropagation()
             event.preventDefault()
             matrixDrawProc(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY)
           }
         }}
         onMouseLeave={(event) => {
           if (drawing) {
             event.stopPropagation()
             event.preventDefault()
             setDrawing(false)
           }
         }}
         onMouseUp={(event) => {
           if (drawing) {
             event.stopPropagation()
             event.preventDefault()
             setDrawing(false)
           }
         }}
         onTouchStart={(event) => {
           event.stopPropagation()
           // event.preventDefault()

           let touch = event.changedTouches[0]
           let rect = getElem().getBoundingClientRect()

           matrixDrawProc(rect, touch.clientX, touch.clientY)
           setDrawing(true)
         }}
         onTouchMove={(event) => {
           if (drawing) {
             event.stopPropagation()
             // event.preventDefault()

             let touch = event.changedTouches[0]
             let rect = getElem().getBoundingClientRect()

             matrixDrawProc(rect, touch.clientX, touch.clientY)
           }
         }}
    >
      {mat}
    </div>
  )
}

interface IEnterMapProps {
  width: number
  height: number
  dots: Uint8ClampedArray
}

const EntireMap = ({width, height, dots}: IEnterMapProps) => {

  const canvasRef = useRef(null);

  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = canvasRef.current;

    return canvas.getContext('2d');
  };

  React.useEffect(() => {
    let tmp = new OffscreenCanvas(width, height)
    let ctx0 = tmp.getContext('2d')
    if (ctx0 != null) {
      let data = ctx0.createImageData(width, height)
      data.data.set(dots)
      ctx0.putImageData(data, 0, 0)

      let ctx = getContext()
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width * 4, height * 4)
      ctx.drawImage(tmp, 0, 0, width, width, 0, 0, width * 4, width * 4)
    }
  }, [dots])
  return (
    <div className={'EntireMap'} style={{width: width * 4 + 'px', height: height * 4 + 'px'}}>
      <canvas className={'canvas'} ref={canvasRef} width={width * 4} height={height * 4}/>
    </div>
  )
}

class TColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;

  constructor(src?: Partial<TColor>) {
    this.red = 0
    this.green = 0
    this.blue = 0
    this.alpha = 0
    Object.assign(this, src)
  }
}

const toRgb = (src: TColor): Array<number> => {
  return [src.red, src.green, src.blue]
}

const toRgba = (src: TColor): Array<number> => {
  return [src.red, src.green, src.blue, src.alpha]
}

const fromRbg = (src: ArrayLike<number>): TColor => {
  if (src.length == 3) {
    return new TColor({red: src[0], green: src[1], blue: src[2], alpha: 255})
  } else {
    return new TColor({red: src[0], green: src[1], blue: src[2], alpha: src[3]})
  }
}

interface IColorPicker {
  color: TColor
  setColor: React.Dispatch<React.SetStateAction<TColor>>
}

const ColorPicker = ({color, setColor}: IColorPicker) => {
  const changeRedProc = (event: ChangeEvent) => {
    let nc = new TColor(color)
    // @ts-ignore
    nc.red = event.target.valueAsNumber
    setColor(nc)
  };
  const changeGreenProc = (event: ChangeEvent) => {
    let nc = new TColor(color)
    // @ts-ignore
    nc.green = event.target.valueAsNumber
    setColor(nc)
  };
  const changeBlueProc = (event: ChangeEvent) => {
    let nc = new TColor(color)
    // @ts-ignore
    nc.blue = event.target.valueAsNumber
    setColor(nc)
  };
  const changeAlphaProc = (event: ChangeEvent) => {
    let nc = new TColor(color)
    // @ts-ignore
    nc.alpha = event.target.valueAsNumber
    setColor(nc)
  };

  return (
    <div className={'ColorPicker'}>
      <div className={'backdrop'}>
        <div className={'ColorTip'} style={{
          backgroundColor: getColorCode(toRgb(color)),
          opacity: color.alpha / 255,
        }}>
        </div>
      </div>
      <ul className={'ColorValues'}>
        <li>
          <label id={'colorRed'}>R
            <input name={'red'} type={'number'} value={color.red} onChange={changeRedProc}/>
            <input name={'red'} type={'range'} min={0} max={255} value={color.red} onChange={changeRedProc}/>
          </label>
        </li>
        <li>
          <label id={'colorGreen'}>G
            <input name={'green'} type={'number'} value={color.green} onChange={changeGreenProc}/>
            <input name={'green'} type={'range'} min={0} max={255} value={color.green} onChange={changeGreenProc}/>
          </label>
        </li>
        <li>
          <label id={'colorBlue'}>B
            <input name={'blue'} type={'number'} value={color.blue} onChange={changeBlueProc}/>
            <input name={'blue'} type={'range'} min={0} max={255} value={color.blue} onChange={changeBlueProc}/>
          </label>
        </li>
        <li>
          <label id={'colorAlpha'}>A
            <input name={'alpha'} type={'number'} value={color.alpha} onChange={changeAlphaProc}/>
            <input name={'alpha'} type={'range'} min={0} max={255} value={color.alpha} onChange={changeAlphaProc}/>
          </label>
        </li>
      </ul>
    </div>
  )
}

const App: React.FC = () => {
  const [width, setWidth] = React.useState(32)
  const [height, setHeight] = React.useState(32)
  const [dots, setDots] = React.useState(new Uint8ClampedArray(width * height * 4))
  const [drawing, setDrawing] = React.useState(false)
  const [penColor, setPenColor] = React.useState({red: 255, green: 255, blue: 255, alpha: 255})

  return (
    <div className="App">
      {/*<header className="App-header">*/}
      {/*</header>*/}
      <div>
        <EntireMap dots={dots} width={width} height={height}/>
        <ColorPicker color={penColor} setColor={setPenColor}/>
      </div>
      <div>
        <Matrix width={width} height={height} drawing={drawing} setDrawing={setDrawing} dots={dots} setDots={setDots}
                penColor={penColor} setPenColor={setPenColor}/>
      </div>
    </div>
  );
}

export default App;
