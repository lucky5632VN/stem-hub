import React from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import 'mafs/font.css';

const Graph2DViewer = ({ functions }) => {
  if (!functions || functions.length === 0) return null;

  return (
    <div className="w-full h-full bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      <Mafs
        pan={true}
        zoom={true}
        viewBox={{ x: [-10, 10], y: [-10, 10] }}
      >
        <Coordinates.Cartesian />
        {functions.map((func, idx) => {
          try {
            // Prompt 3 Mission 2: Safely parse expression string into JS function
            // AI returns string like "Math.sin(x)"
            const parsedFunction = new Function("x", "return " + func.expression);
            
            return (
              <Plot.OfX
                key={idx}
                y={(x) => {
                  try {
                    return parsedFunction(x);
                  } catch (e) {
                    return 0;
                  }
                }}
                color={func.color || Theme.blue}
                weight={3}
              />
            );
          } catch (err) {
            console.error("Error parsing function:", func.expression, err);
            return null;
          }
        })}
      </Mafs>
    </div>
  );
};

export default Graph2DViewer;
