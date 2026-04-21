import { useState, useRef, useCallback } from 'react';
import './MediaSlider.css';

function MediaSlider({ media }) {
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef({});

  const pauseAllVideos = useCallback(() => {
    Object.values(videoRefs.current).forEach(v => {
      if (v && !v.paused) v.pause();
    });
  }, []);

  if (!media || media.length === 0) return null;

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="section-media">
        {item.type === 'video' ? (
          <video controls preload="metadata">
            <source src={item.url} />
          </video>
        ) : (
          <img src={item.url} alt="" />
        )}
      </div>
    );
  }

  const goTo = (idx) => {
    pauseAllVideos();
    setCurrent(idx);
  };

  const prev = () => goTo((current - 1 + media.length) % media.length);
  const next = () => goTo((current + 1) % media.length);

  return (
    <div className="media-slider">
      <div
        className="media-slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {media.map((item, idx) => (
          <div key={idx} className="media-slider-slide">
            {item.type === 'video' ? (
              <video
                ref={el => { videoRefs.current[idx] = el; }}
                controls
                preload="metadata"
              >
                <source src={item.url} />
              </video>
            ) : (
              <img src={item.url} alt="" />
            )}
          </div>
        ))}
      </div>
      <button className="media-slider-arrow prev" onClick={prev} type="button">&#8249;</button>
      <button className="media-slider-arrow next" onClick={next} type="button">&#8250;</button>
      <div className="media-slider-dots">
        {media.map((_, idx) => (
          <button
            key={idx}
            className={`media-slider-dot${idx === current ? ' active' : ''}`}
            onClick={() => goTo(idx)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export default MediaSlider;
