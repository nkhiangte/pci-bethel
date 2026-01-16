
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Thawhlawm: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/#contribution', { replace: true });
  }, [navigate]);
  return null;
};

export default Thawhlawm;
