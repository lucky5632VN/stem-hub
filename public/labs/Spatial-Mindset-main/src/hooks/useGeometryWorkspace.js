/**
 * useGeometryWorkspace — Hook quản lý state của geometry workspace
 * Bao gồm: promptInput, geometryData, algebraData, loading, error, quiz
 */
import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';

// Sanitize input: loại bỏ multiple choice options trước khi gửi backend
const sanitizeQuery = (input) =>
  input.split(/\n\s*[A-D]\./).at(0).trim();

export function useGeometryWorkspace({ gainXP, triggerCelebration }) {
  const [promptInput, setPromptInput] = useState('');
  const [geometryData, setGeometryData] = useState(null);
  const [hintData, setHintData] = useState(null);
  const [algebraData, setAlgebraData] = useState(null);
  const [showAlgebraSolution, setShowAlgebraSolution] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [uploadedImage, setUploadedImage] = useState(null);
  const [graphExpression, setGraphExpression] = useState('sin(x)');

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null); // 'correct' | 'wrong' | null

  const controlsRef = useRef();
  const textareaRef = useRef(null);

  const resetState = useCallback(() => {
    setCompletedSteps(new Set());
    setSelectedAnswer(null);
    setQuizResult(null);
    setError('');
  }, []);

  const handleGenerate = useCallback(async (activeMode, streak) => {
    if (!promptInput.trim()) {
      setError('Vui lòng nhập đề bài để bắt đầu.');
      return null;
    }
    if (loading) return null;

    setLoading(true);
    resetState();

    try {
      let resultMode = activeMode;
        let query = activeMode === 'VECTOR'
          ? `${promptInput} (Hãy xử lý bài toán này dưới góc độ vector không gian, vẽ các mũi tên vector)`
          : promptInput;
        query = sanitizeQuery(query);

        const data = await apiClient.post('/api/geometry/calculate', {
          query,
          image: uploadedImage,
        });

        setGeometryData(data);
        setHintData(data.hint ?? null);
        setActiveStep(0);

        if (data.type === '2D') {
          resultMode = 'GRAPH';
        }

        gainXP(data.xp_reward || 30);

      } else if (activeMode === 'GRAPH') {
        const data = await apiClient.post('/api/algebra/solve', {
          query: promptInput,
          image: uploadedImage,
        });

        setAlgebraData(data);
        setShowAlgebraSolution(true);
        if (data.function_string) {
          setGraphExpression(data.function_string);
        }
        setHintData(null);
        gainXP(40);
      }

      if (controlsRef.current) {
        controlsRef.current.reset();
      }
      return resultMode;

    } catch (err) {
      let msg = 'Mất kết nối với AI Backend. Hãy kiểm tra server.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.response?.status === 429) {
        msg = 'Hệ thống đang bận (Rate Limit). Vui lòng đợi một lát rồi thử lại.';
      } else if (err.code === 'ECONNABORTED') {
        msg = 'AI mất quá lâu để phản hồi (>60s). Vui lòng thử lại với đề bài đơn giản hơn.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      console.error('[useGeometryWorkspace] handleGenerate error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [promptInput, loading, uploadedImage, gainXP, resetState]);

  const handleStepClick = useCallback((idx) => {
    setActiveStep(idx + 1);
    if (!completedSteps.has(idx)) {
      setCompletedSteps((prev) => new Set([...prev, idx]));
      gainXP(20);
      // Confetti khi hoàn thành bước cuối
      if (geometryData?.steps && idx === geometryData.steps.length - 1) {
        triggerCelebration(1);
      }
    }
  }, [completedSteps, geometryData, gainXP, triggerCelebration]);

  const handleAnswerSelect = useCallback((idx, streak) => {
    if (quizResult === 'correct') return;
    setSelectedAnswer(idx);
    const isCorrect = idx === geometryData?.final_quiz?.correct_index;
    if (isCorrect) {
      setQuizResult('correct');
      gainXP(50 + (streak || 0) * 5);
      triggerCelebration(2);
    } else {
      setQuizResult('wrong');
    }
  }, [quizResult, geometryData, gainXP, triggerCelebration]);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  return {
    promptInput, setPromptInput,
    geometryData, setGeometryData,
    hintData, setHintData,
    algebraData,
    showAlgebraSolution, setShowAlgebraSolution,
    loading,
    error, setError,
    activeStep, setActiveStep,
    completedSteps,
    uploadedImage, setUploadedImage,
    graphExpression, setGraphExpression,
    selectedAnswer,
    quizResult,
    controlsRef,
    textareaRef,
    handleGenerate,
    handleStepClick,
    handleAnswerSelect,
    handleResetCamera,
  };
}
