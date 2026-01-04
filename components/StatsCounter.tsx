
import React, { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Users, BookOpen, Home as HomeIcon } from 'lucide-react';

const statsData = {
    families: 440, // 431 + 9
    members: 2094,
    sundaySchoolStudents: 1773
};

const AnimatedCounter = ({ endValue }: { endValue: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        const duration = 2000; // 2 seconds

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            setCount(Math.floor(endValue * percentage));

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                setCount(endValue); // Ensure it ends on the exact value
            }
        };

        requestAnimationFrame(animate);

    }, [endValue]);

    return <span className="text-4xl lg:text-5xl font-bold text-church-900">{count.toLocaleString()}</span>;
};

const StatsCounter: React.FC = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const statItems = [
    { icon: Users, value: statsData.members, label: 'Total Members' },
    { icon: HomeIcon, value: statsData.families, label: 'Families' },
    { icon: BookOpen, value: statsData.sundaySchoolStudents, label: 'Sunday School Students' }
  ];

  return (
    <div ref={ref} className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-church-900 sm:text-4xl">
              Our Community at a Glance
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              A vibrant and growing family in faith.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
            {statItems.map((stat, index) => (
              <div key={index} className="mx-auto flex max-w-xs flex-col gap-y-4">
                <dt className="text-base leading-7 text-slate-600 flex items-center justify-center gap-x-3">
                  <stat.icon className="h-6 w-6 text-church-500" aria-hidden="true" />
                  {stat.label}
                </dt>
                <dd className="order-first">
                  {isVisible ? <AnimatedCounter endValue={stat.value} /> : <span className="text-4xl lg:text-5xl font-bold text-church-900">0</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default StatsCounter;
