type ImageMeta = {
  width: number;
  height: number;
  channels: number;
};

export const getCoord = (
  e: MouseEvent | TouchEvent,
  cols: number,
  rows: number
) => {
  const canvas = e.target as HTMLCanvasElement;
  const { left, top, width, height } = canvas.getBoundingClientRect();
  let posX, posY;
  if (e instanceof MouseEvent) {
    [posX, posY] = [e.clientX - left, e.clientY - top];
  } else {
    [posX, posY] = [e.touches[0].clientX - left, e.touches[0].clientY - top];
  }
  const x = Math.floor(posX / (width / cols));
  const y = Math.floor(posY / (height / rows));
  return { x, y };
};

const fitCanvas = (canvas: HTMLCanvasElement, render: Function) => {
  if (
    canvas.width === canvas.clientWidth * 2 &&
    canvas.height === canvas.clientHeight
  )
    return;
  [canvas.width, canvas.height] = [
    canvas.clientWidth * 2,
    canvas.clientHeight * 2,
  ];
  render();
};

export const autoResize = (canvas: HTMLCanvasElement, render: Function) => {
  fitCanvas(canvas, render);
  let lastResized = false;
  addEventListener("resize", () => {
    if (!lastResized) {
      fitCanvas(canvas, render);
      lastResized = true;
      setTimeout(() => {
        lastResized = false;
        fitCanvas(canvas, render);
      }, 300);
    }
  });
};

const loadImage = (image: HTMLImageElement) => {
  return new Promise((resolve) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0);
      const data = context?.getImageData(0, 0, canvas.width, canvas.height);
      resolve(data as ImageData);
    };
  });
};

const getImageData = async (url: string) => {
  const image = new Image();
  image.src = url;
  return (await loadImage(image)) as ImageData;
};

const imageDataToPixels = (data: ImageData) => {
  const { height, width } = data;
  const raw = data.data;
  const pixels: string[][] = Array.from({ length: height }, (_) =>
    Array(width)
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = 4 * (y * width + x);
      const rgba = `rgba(${raw[pos]}, ${raw[pos + 1]}, ${raw[pos + 2]}, ${
        raw[pos + 3]
      })`;
      pixels[y][x] = rgba;
    }
  }
  return pixels;
};

export const pixelsFromUrl = async (url: string, toWidth: number = 0) => {
  const data = (await getImageData(url)) as ImageData;
  if (toWidth) {
    const scalled = scale(
      data.data,
      { height: data.height, width: data.width, channels: 4 },
      toWidth
    );
    return imageDataToPixels({
      data: scalled.data,
      width: scalled.info.width,
      height: scalled.info.height,
    } as ImageData);
  }
  return imageDataToPixels(data);
};

const scale = (
  data: Uint8ClampedArray,
  info: ImageMeta,
  desiredWidth: number
) => {
  const { width, height, channels } = info;
  const factor = desiredWidth / width;
  const newHeight = Math.floor(height * factor);
  const newWidth = Math.floor(width * factor);
  const newInfo = { ...info, width: newWidth, height: newHeight };
  const scaled = new Uint8ClampedArray(newWidth * newHeight * channels);
  const pixelsPerBlock = factor >= 1 ? 1 : (1 / factor) ** 2;
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const avgPixel = Array(channels).fill(0);
      for (let yOff = 0; yOff < 1 / factor; yOff++) {
        for (let xOff = 0; xOff < 1 / factor; xOff++) {
          const yPos = Math.floor((y * 1) / factor) + yOff;
          const xPos = Math.floor((x * 1) / factor) + xOff;
          const pos = channels * (yPos * width + xPos);
          for (let colorOff = 0; colorOff < channels; colorOff++) {
            avgPixel[colorOff] += data[pos + colorOff] / pixelsPerBlock;
          }
        }
      }
      for (let colorOff = 0; colorOff < info.channels; colorOff++) {
        const pos = channels * (y * newWidth + x) + colorOff;
        scaled[pos] = avgPixel[colorOff];
      }
    }
  }
  return { data: scaled, info: newInfo };
};

export const fitSquare = (pixels: string[][]): string[][] => {
  const width = pixels[0].length;
  const height = pixels.length;
  const halfDiff = Math.floor(Math.abs(width - height) / 2);
  if (height < width) {
    const rows = Array.from({ length: halfDiff }, () =>
      Array(width).fill("rgba(0, 0, 0, 0)")
    );
    return [...rows, ...pixels, ...rows];
  }
  if (height > width) {
    return pixels.slice(halfDiff, height - halfDiff);
  }
  return pixels;
};
