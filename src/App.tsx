import React, {useRef} from 'react';
import './App.css';

interface IDotProps {
  x: number
  y: number
  // width: number
  dots: Uint8ClampedArray
}

const Dot = ({x, y, dots}: IDotProps) => {
  let col:string = '#'+
      dots[0].toString(16).padStart(2, '0') +
      dots[1].toString(16).padStart(2, '0') +
      dots[2].toString(16).padStart(2, '0')

  let style = {
    backgroundColor: col,
    opacity: dots[3] / 255,
  }
  return (<div className={'Dot'} style={style}/>)
}

interface IMatrixProps {
  width: number
  height: number
  dots: Uint8ClampedArray
  setDots: React.Dispatch<React.SetStateAction<Uint8ClampedArray>>
}

const Matrix = ({width, height, dots, setDots}: IMatrixProps) => {
  let mat: any[] = []
  for (let y = 0; y < height; y++) {
    let row: any[] = []
    for (let x = 0; x < width; x++) {
      let ix = (y * width + x) * 4;
      // @ts-ignore
      row.push((<Dot x={x} y={y} dots={dots.slice(ix)}> </Dot>))
    }
    mat.push((<div style={{height: '16px'}}>{row}</div>))
  }
  return (
      <div className={'Matrix'} style={{width: width * 16 + 'px'}} onMouseDown={(e) => {
        let rect = e.currentTarget.getBoundingClientRect();
        // console.log(e.clientX, e.clientY, rect)
        let dx = Math.floor((e.clientX - rect.left) / 16)
        let dy = Math.floor((e.clientY - rect.top) / 16)
        let ix = (dy * width + dx) * 4
        // console.log(dx,dy,ix)
        if (ix >= 0 && ix < width * height * 4) {
          let nd = Uint8ClampedArray.from(dots)
          nd[ix + 0] = 0xff
          nd[ix + 1] = 0xff
          nd[ix + 2] = 0xff
          nd[ix + 3] = 0xff
          setDots(nd)
        }
      }}>
        {mat}
      </div>
  )
}

interface IEnterMapProps {
  width: number
  height: number
  dots: Uint8ClampedArray
}

const EntireMap = ({width, height, dots} :IEnterMapProps) => {

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
      ctx.clearRect(0,0,width * 4,height * 4)
      ctx.drawImage(tmp,0,0,width,width,0,0,width * 4,width * 4)
    }
  })
  return (
      <div className={'EntireMap'} style={{width: width * 4 + 'px', height:height * 4 + 'px'}}>
        <canvas className={'canvas'} ref={canvasRef} width={width * 4} height={height * 4}/>
      </div>
  )
}

const App: React.FC = () => {
  const [width, setWidth] = React.useState(32)
  const [height, setHeight] = React.useState(32)
  const [dots, setDots] = React.useState(new Uint8ClampedArray(width * height * 4))

  return (
    <div className="App">
      {/*<header className="App-header">*/}
      {/*</header>*/}
      <EntireMap dots={dots} width={width} height={height}/>
      <Matrix width={width} height={height} dots={dots} setDots={setDots}/>
    </div>
  );
}

export default App;
