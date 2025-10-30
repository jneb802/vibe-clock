# Vibe Clock

A simple and fun 3D clock that floats over beautiful animated ocean waves.

**Live at [vibeclock.app](https://vibeclock.app)**

## About

Vibe Clock is a WebGPU-powered clock visualization featuring realistic ocean wave simulation. The clock hovers above the waves, creating a peaceful and mesmerizing way to check the time.

Built with BabylonJS and WebGPU, featuring:
- Real-time 3D clock display
- GPU-based ocean wave simulation using FFT
- Phillips spectrum for realistic wave patterns
- Physically based water shading
- Interactive camera controls

## Tech Stack

- **BabylonJS** - 3D rendering engine
- **WebGPU** - Hardware-accelerated graphics
- **TypeScript** - Type-safe development
- **Ocean Simulation** - Based on [Jerry Tessendorf's paper](https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf)

## Credits

Built on top of [WebTide](https://github.com/BarthPaleologue/WebTide) by BarthPaleologue.

Ocean simulation based on resources from:
- [Simulating Ocean Water](https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf) by Jerry Tessendorf
- GPU-based FFT from [BabylonJS Ocean Demo](https://github.com/Popov72/OceanDemo) by Popov72
- Specular coefficients from [Shadertoy](https://www.shadertoy.com/view/MdXyzX) by afl_ext

## Run locally

To run the project locally, you need to have Node.js installed. Then, run the following commands:

```bash
pnpm install
pnpm run serve
```

If you don't have `pnpm` installed, you can install it with `npm install -g pnpm`.
