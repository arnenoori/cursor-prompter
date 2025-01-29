import React, { useEffect, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import Image from 'next/image';
import opentype from 'opentype.js';

const Footer: React.FC = () => {
  const ref = React.useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '100px',
  });

  return (
    <footer
      ref={ref}
      className="flex items-center gap-1 w-fit mx-auto mb-4 bottom-4 text-gr-500 text-sm z-10 absolute"
    >
      <DynamicSignature text="ANoori" isInView={isInView} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 3 }}
        className="flex items-center gap-1"
      >
        Crafted by{' '}
        <a
          href="https://arne.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gray-700 font-medium rounded-full p-1 -mx-0.5 transition-colors duration-150 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
        >
          <Image
            src="/arne.jpg"
            alt="Avatar of Arne"
            width={20}
            height={20}
            className="border border-gray-200 rounded-full"
          />
          Arne
        </a>{' '}
      </motion.div>
    </footer>
  );
};

const DynamicSignature: React.FC<{ text: string; isInView: boolean }> = ({ text, isInView }) => {
  const [path, setPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const controls = useAnimation();

  useEffect(() => {
    const loadFontAndCreatePath = async () => {
      try {
        console.log('Loading font...');
        const font = await opentype.load('/fonts/BastligaOne.ttf');
        console.log('Font loaded successfully');
        
        const path = font.getPath(text, 0, 60, 48);
        const pathData = path.toPathData(2);
        console.log('Path data generated:', pathData);
        
        setPath(pathData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading font or creating path:', error);
        setIsLoading(false);
      }
    };

    loadFontAndCreatePath();
  }, [text]);

  useEffect(() => {
    if (isInView && !isLoading && path) {
      console.log('Starting animation');
      controls.start({ pathLength: 1, opacity: 1 });
    }
  }, [isInView, isLoading, path, controls]);

  if (isLoading) {
    return <div>Loading signature...</div>;
  }

  return (
    <motion.svg
      width="300"
      height="100"
      viewBox="0 0 300 100"
      initial={{ opacity: 1 }}
      animate={isInView ? { opacity: [1, 1, 0] } : {}}
      transition={{ duration: 3, times: [0, 0.8, 1] }}
      className="absolute left-[-320px] pointer-events-none"
    >
      <motion.path
        d={path}
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={controls}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};

export default Footer;