import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../components/header';
import Footer from '../components/footer';
import { headerConfig } from '../config/headerConfig';
import styles from '../styles/ImpactStories.module.css';
import { toast } from 'react-toastify';

const ImpactStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const storyStartTimeRef = useRef(null);
  const currentMediaRefRef = useRef(0);

  useEffect(() => {
    axios.get('/api/impact-stories')
      .then(res => {
        setStories(res.data.stories);
        setLoading(false);
        toast.success('Impact stories loaded successfully!');
      })
      .catch(err => {
        console.error('Error fetching stories:', err);
        setLoading(false);
        toast.error('Failed to load impact stories. Please try again later.');
      });
  }, []);

  // auto-advance with stable animated progress - resets for each media item
  useEffect(() => {
    if (selectedStoryIndex !== null) {
      storyStartTimeRef.current = Date.now();
      currentMediaRefRef.current = currentMediaIndex;
      const DURATION = 10000; // 10 seconds

      const animateProgress = () => {
        const elapsed = Date.now() - storyStartTimeRef.current;
        const progress = Math.min((elapsed / DURATION) * 100, 100);
        setProgressPercent(progress);

        if (elapsed < DURATION) {
          requestAnimationFrame(animateProgress);
        } else {
          // Auto-advance after 10 seconds
          const story = stories[selectedStoryIndex];
          const totalMedia = (story?.images?.length || 0) + (story?.videos?.length || 0);
          if (currentMediaIndex < totalMedia - 1) {
            setCurrentMediaIndex(prev => prev + 1);
          } else {
            nextStory();
          }
        }
      };

      const frameId = requestAnimationFrame(animateProgress);
      return () => cancelAnimationFrame(frameId);
    }
  }, [selectedStoryIndex, currentMediaIndex]);

  const openStory = (index) => {
    setSelectedStoryIndex(index);
    setCurrentMediaIndex(0);
    toast.info(`Viewing: ${stories[index].title}`);
  };
  const closeStory = () => {
    setSelectedStoryIndex(null);
    setCurrentMediaIndex(0);
  };
  const nextStory = () => {
    if (selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
      setCurrentMediaIndex(0);
    } else {
      closeStory();
    }
  };
  const prevStory = () => {
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
      setCurrentMediaIndex(0);
    }
  };
  const nextMedia = () => {
    const story = stories[selectedStoryIndex];
    const totalMedia = (story.images?.length || 0) + (story.videos?.length || 0);
    if (currentMediaIndex < totalMedia - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else {
      nextStory();
    }
  };
  const prevMedia = () => {
    if (currentMediaIndex > 0) setCurrentMediaIndex(currentMediaIndex - 1);
  };

  const getThumbnail = (story) => {
    if (story.images && story.images.length > 0) {
      const imgPath = story.images[0];
      return `/${imgPath}`;
    }
    return null;
  };

  const getAllMedia = (story) => {
    const media = [];
    if (story.images) {
      story.images.forEach(img => {
        const path = img.startsWith('/') ? img : `/${img}`;
        media.push({ type: 'image', src: path });
      });
    }
    if (story.videos) {
      story.videos.forEach(vid => {
        const path = vid.startsWith('/') ? vid : `/${vid}`;
        media.push({ type: 'video', src: path });
      });
    }
    return media;
  };

  if (loading) return (
    <>
      <Header navItems={headerConfig.landing} />
      <div className={styles.loading}>Loading Impact Stories...</div>
      <Footer />
    </>
  );
  if (stories.length === 0) return (
    <>
      <Header navItems={headerConfig.landing} />
      <div className={styles.noStories}>No impact stories yet. Come back soon!</div>
      <Footer />
    </>
  );

  return (
    <>
      <Header navItems={headerConfig.landing} />
      {selectedStoryIndex === null ? (
        <div className={styles.pageContainer}>
          <div className={styles.heroSection}>
            <h1 className={styles.pageTitle}>Impact Stories</h1>
            <p className={styles.pageSubtitle}>Discover the real stories of positive change from our partners</p>
          </div>
          <div className={styles.storiesGrid}>
            {stories.map((story, index) => (
              <div
                key={index}
                className={styles.storyCard}
                onClick={() => openStory(index)}
              >
                <div className={styles.thumbnailContainer}>
                  {getThumbnail(story) ? (
                    <img src={getThumbnail(story)} alt={story.title} className={styles.cardThumbnail} />
                  ) : (
                    <div className={styles.noThumbnail}>
                      <div className={styles.placeholderIcon}>MEDIA</div>
                    </div>
                  )}
                </div>
                <div className={styles.cardOverlay}>
                  <h3 className={styles.cardTitle}>{story.title}</h3>
                  <p className={styles.cardCarehome}>{story.carehomeId?.care_home_name}</p>
                  <p className={styles.cardLocation}>{story.carehomeId?.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.storyDetailsContainer} onClick={closeStory}>
          <div className={styles.storyViewer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${progressPercent}%`,
                  transition: 'width 0.05s linear'
                }}
              />
            </div>

            <button className={styles.closeBtn} onClick={closeStory}>×</button>

            <div className={styles.storyCounter}>
              {selectedStoryIndex + 1} of {stories.length}
            </div>

            <div className={styles.mediaContainer} onClick={nextMedia}>
              {getAllMedia(stories[selectedStoryIndex])[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={getAllMedia(stories[selectedStoryIndex])[currentMediaIndex]?.src}
                  alt="Story media"
                  className={styles.storyMedia}
                />
              ) : (
                <video
                  src={getAllMedia(stories[selectedStoryIndex])[currentMediaIndex]?.src}
                  className={styles.storyMedia}
                  autoPlay
                  muted
                />
              )}
            </div>

            <div className={styles.storyInfo}>
              <h2 className={styles.storyModalTitle}>{stories[selectedStoryIndex].title}</h2>
              <p className={styles.storyModalDescription}>{stories[selectedStoryIndex].description}</p>
              <div className={styles.storyModalCarehome}>
                <p><strong>{stories[selectedStoryIndex].carehomeId?.care_home_name}</strong></p>
                <p>{stories[selectedStoryIndex].carehomeId?.city}</p>
              </div>
            </div>

            <div className={styles.navigationArea} onClick={prevMedia}>
              {currentMediaIndex > 0 && (
                <button className={styles.navArrow} onClick={(e) => { e.stopPropagation(); prevMedia(); }}>‹</button>
              )}
            </div>
            <div className={`${styles.navigationArea} ${styles.right}`} onClick={nextMedia}>
              {currentMediaIndex < getAllMedia(stories[selectedStoryIndex]).length - 1 && (
                <button className={styles.navArrow} onClick={(e) => { e.stopPropagation(); nextMedia(); }}>›</button>
              )}
            </div>

            <div className={styles.navigationArea} onClick={prevStory} style={{ width: '20%', left: 0 }}>
              {selectedStoryIndex > 0 && currentMediaIndex === 0 && (
                <button className={styles.navArrow} onClick={(e) => { e.stopPropagation(); prevStory(); }}>‹‹</button>
              )}
            </div>
            <div className={`${styles.navigationArea} ${styles.right}`} onClick={nextStory} style={{ width: '20%', right: 0 }}>
              {selectedStoryIndex < stories.length - 1 && currentMediaIndex === getAllMedia(stories[selectedStoryIndex]).length - 1 && (
                <button className={styles.navArrow} onClick={(e) => { e.stopPropagation(); nextStory(); }}>››</button>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ImpactStories;
