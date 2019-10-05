import React, {ChangeEvent, useRef} from 'react';
import './App.css';

const getColorCode = (dots: ArrayLike<number>) => '#' +
  dots[0].toString(16).padStart(2, '0') +
  dots[1].toString(16).padStart(2, '0') +
  dots[2].toString(16).padStart(2, '0');

interface IMatrixProps {
  width: number
  height: number
  drawing: boolean
  dots: Uint8ClampedArray
  setDots: React.Dispatch<React.SetStateAction<Uint8ClampedArray>>
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>
  palette: TColor[]
  setPalette: React.Dispatch<React.SetStateAction<TColor[]>>
  penColorIndex: number
  setPenColorIndex: React.Dispatch<React.SetStateAction<number>>
}

const Matrix = ({width, height, dots, setDots, drawing, setDrawing, palette, setPalette, penColorIndex}: IMatrixProps) => {
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
    if (ix >= 0 && ix < width * height * 4) {
      let nd = Uint8ClampedArray.from(dots)
      nd.set(toRgba(palette[penColorIndex]), ix)
      setDots(nd)
    }
  }

  const canvasRef = useRef(null);

  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = canvasRef.current;

    return canvas.getContext('2d');
  };

  const zoom = 16

  React.useEffect(() => {
    let tmp = new OffscreenCanvas(width, height)
    let ctx0 = tmp.getContext('2d')
    if (ctx0 != null) {
      let data = ctx0.createImageData(width, height)
      data.data.set(dots)
      ctx0.putImageData(data, 0, 0)

      let ctx = getContext()
      ctx.imageSmoothingEnabled = false

      ctx.clearRect(0, 0, width * zoom, height * zoom)
      ctx.drawImage(tmp, 0, 0, width, width, 0, 0, width * zoom, width * zoom)
    }
  }, [dots])

  return (
    <div className={'Matrix'} ref={elemRef} style={{width: width * zoom + 'px'}}
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
             let np = Array.from<TColor>(palette)
             np[-1] = fromRbg(cells[cellIndex].subarray(ix))
             setPalette(np)
             setPenColorIndex(-1)
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
         onTouchEnd={(event) => {
             if (drawing) {
                 event.stopPropagation()
                 event.preventDefault()
                 setDrawing(false)
             }
         }}
         onTouchCancel={(event) => {
             if (drawing) {
                 event.stopPropagation()
                 event.preventDefault()
                 setDrawing(false)
             }
         }}
    >
      {/*{mat}*/}
      <canvas ref={canvasRef} width={width * zoom} height={width * zoom}>
      </canvas>
    </div>
  )
}

interface IEnterMapProps {
  width: number
  height: number
  dots: Uint8ClampedArray
}

const EntireMap = ({width, height, dots}: IEnterMapProps) => {
  const zoom = 3;
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

      ctx.clearRect(0, 0, width * zoom, height * zoom)
      ctx.drawImage(tmp, 0, 0, width, width, 0, 0, width * zoom, width * zoom)
    }
  }, [dots])
  return (
    <div className={'EntireMap'} style={{width: width * zoom + 'px', height: height * zoom + 'px'}}>
      <canvas className={'canvas'} ref={canvasRef} width={width * zoom} height={height * zoom}/>
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
  palette: TColor[]
  setPallet:  React.Dispatch<React.SetStateAction<TColor[]>>
  penColorIndex: number
}

const ColorPicker = ({palette, setPallet, penColorIndex}: IColorPicker) => {
  const changeRedProc = (event: ChangeEvent) => {
    let np = Array.from<TColor>(palette)
    // @ts-ignore
    np[penColorIndex].red = event.target.valueAsNumber
    setPallet(np)
  };
  const changeGreenProc = (event: ChangeEvent) => {
    let np = Array.from<TColor>(palette)
    // @ts-ignore
    np[penColorIndex].green = event.target.valueAsNumber
    setPallet(np)
  };
  const changeBlueProc = (event: ChangeEvent) => {
    let np = Array.from<TColor>(palette)
    // @ts-ignore
    np[penColorIndex].blue = event.target.valueAsNumber
    setPallet(np)
  };
  const changeAlphaProc = (event: ChangeEvent) => {
    let np = Array.from<TColor>(palette)
    // @ts-ignore
    np[penColorIndex].alpha = event.target.valueAsNumber
    setPallet(np)
  };

  let color = palette[penColorIndex]
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
          <label id={'colorRed'}><span>R</span>
            <input name={'red'} type={'number'} value={color.red} onChange={changeRedProc}/>
            <input name={'red'} type={'range'} min={0} max={255} value={color.red} onChange={changeRedProc}/>
          </label>
        </li>
        <li>
          <label id={'colorGreen'}><span>G</span>
            <input name={'green'} type={'number'} value={color.green} onChange={changeGreenProc}/>
            <input name={'green'} type={'range'} min={0} max={255} value={color.green} onChange={changeGreenProc}/>
          </label>
        </li>
        <li>
          <label id={'colorBlue'}><span>B</span>
            <input name={'blue'} type={'number'} value={color.blue} onChange={changeBlueProc}/>
            <input name={'blue'} type={'range'} min={0} max={255} value={color.blue} onChange={changeBlueProc}/>
          </label>
        </li>
        <li>
          <label id={'colorAlpha'}><span>A</span>
            <input name={'alpha'} type={'number'} value={color.alpha} onChange={changeAlphaProc}/>
            <input name={'alpha'} type={'range'} min={0} max={255} value={color.alpha} onChange={changeAlphaProc}/>
          </label>
        </li>
      </ul>
    </div>
  )
}

interface IColorPalette {
  palettes: TColor[]
  setPalette: React.Dispatch<React.SetStateAction<TColor[]>>
  penColorIndex: number
  setPenColorIndex: React.Dispatch<React.SetStateAction<number>>
}

const ColorPalette = ({palettes, setPalette, penColorIndex, setPenColorIndex}: IColorPalette) =>{
  let p = palettes.map((v, ix) => {
    let style: object = {}
    if (ix == penColorIndex) {
      style = {borderColor: 'lightgray', borderWidth: '2px', margin: '0px'}
    }
    return (<li className={'Palette'} data-palette-index={ix} onClick={(event) => {
      let dataset = event.currentTarget.dataset;
      let ix: number = parseInt(dataset['paletteIndex'] || '0')
      setPenColorIndex(ix)
    }} style={style}>
      <div style={{backgroundColor: getColorCode(toRgba(v)), opacity: v.alpha / 255 }}/>
    </li>)
  })

  return (
    <div className={'ColorPalette'}>
      <ul style={{display: 'flex', flexFlow: 'raw wrap'}}>
        {p}
        <li className={'AddPalette'} onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          let np = Array.from<TColor>(palettes);
          let sc = palettes[penColorIndex];
          if (penColorIndex < 0) {
            np.push({red: sc.red, green: sc.green, blue: sc.blue, alpha: sc.alpha}) // deep copy
            setPenColorIndex(palettes.length)
          } else {
            np.push({red: 0, green: 0, blue: 0, alpha: 0}) // deep copy
            np.copyWithin(penColorIndex + 1, penColorIndex)
            np[penColorIndex] = {red: sc.red, green: sc.green, blue: sc.blue, alpha: sc.alpha}
            setPenColorIndex(penColorIndex + 1)
          }
          setPalette(np)
        }}
        ><div>+</div></li>
      </ul>
    </div>
  )
}

const App: React.FC = () => {
  const [width, setWidth] = React.useState(32)
  const [height, setHeight] = React.useState(32)
  const [dots, setDots] = React.useState(new Uint8ClampedArray(width * height * 4))
  const [drawing, setDrawing] = React.useState(false)
  const [penColorIndex, setPenColorIndex] = React.useState(1)
  let p: TColor[] = [
    {red: 0, green: 0, blue: 0, alpha: 0},
    {red: 255, green: 255, blue: 255, alpha: 255}]
  const [palettes, setPallets] = React.useState(p)

  return (
    <div className="App">
      {/*<header className="App-header">*/}
      {/*</header>*/}
      <div>
        <EntireMap dots={dots} width={width} height={height}/>
      </div>
      <div>
        <div style={{display: 'flex', flexFlow: 'row'}}>
        <ColorPicker palette={palettes} setPallet={setPallets} penColorIndex={penColorIndex}/>
        <ColorPalette palettes={palettes} penColorIndex={penColorIndex} setPenColorIndex={setPenColorIndex} setPalette={setPallets}/>
        </div>
        <Matrix width={width} height={height} drawing={drawing} setDrawing={setDrawing} dots={dots} setDots={setDots}
                palette={palettes} setPalette={setPallets} penColorIndex={penColorIndex}
        />
      </div>
    </div>
  );
}

export default App;
