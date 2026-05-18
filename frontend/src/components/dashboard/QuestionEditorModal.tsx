'use client';

import React, { useState, useEffect } from 'react';
import { ModalProps } from '@/types/components.types';
import { Icon, Button, Input, Select } from '@/components/ui';
import { Question } from '@/services/teacher/modules/questionsService';
import { toast } from 'react-hot-toast';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSave: (updatedQuestion: any) => Promise<void>;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  question,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
        duration: question.duration || 60,
        options: Array.isArray(question.options) ? [...question.options] : [],
        correct_answer: question.correct_answer,
      });
    } else if (isOpen) {
      // Default values for new question
      setFormData({
        text: '',
        type: 'mcq',
        difficulty: 'easy',
        duration: 60,
        options: ['', '', '', ''],
        correct_answer: '',
      });
    }
  }, [question, isOpen]);

  if (!formData) return null;

  const handleTypeChange = (type: string) => {
    let newOptions = [];
    let newCorrectAnswer: any = '';

    if (type === 'mcq') {
      newOptions = ['', '', '', ''];
      newCorrectAnswer = '';
    } else if (type === 'true_false') {
      newOptions = ['صح', 'خطأ'];
      newCorrectAnswer = 'صح';
    } else if (type === 'ordering') {
      newOptions = ['', ''];
      newCorrectAnswer = '';
    } else if (type === 'matching') {
      newOptions = [{ a: '', b: '' }, { a: '', b: '' }];
      newCorrectAnswer = '';
    }

    setFormData({
      ...formData,
      type,
      options: newOptions,
      correct_answer: newCorrectAnswer,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleMatchingChange = (index: number, field: 'a' | 'b', value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    const newCorrectAnswer = newOptions
      .map((p: any) => `${p.a}===${p.b}`)
      .join('|||');

    setFormData({ 
      ...formData, 
      options: newOptions,
      correct_answer: newCorrectAnswer
    });
  };

  const handleOrderingChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    
    const newCorrectAnswer = newOptions.join('|||');

    setFormData({ 
      ...formData, 
      options: newOptions,
      correct_answer: newCorrectAnswer
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      toast.error('يرجى كتابة نص السؤال');
      return;
    }

    if (formData.type === 'mcq' && !formData.correct_answer) {
      toast.error('يرجى تحديد الإجابة الصحيحة');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        id: question?.id
      });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ السؤال');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-2xl bg-[#0f1225] border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${question ? 'bg-primary/20 text-primary shadow-primary/10' : 'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/10'}`}>
              <Icon name={question ? 'edit' : 'plus'} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{question ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</h2>
              <p className="text-xs text-gray-light/40">{question ? 'تحديث بيانات السؤال في بنك الأسئلة' : 'إضافة سؤال جديد لبنك الأسئلة الخاص بك'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-light transition-all">
            <Icon name="times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-light/60 mb-2 mr-1">نوع السؤال</label>
              <Select
                options={[
                  { value: 'mcq', label: 'اختيار من متعدد' },
                  { value: 'true_false', label: 'صح أو خطأ' },
                  { value: 'ordering', label: 'ترتيب' },
                  { value: 'matching', label: 'توصيل' },
                ]}
                value={formData.type}
                onChange={handleTypeChange}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-light/60 mb-2 mr-1">مستوى الصعوبة</label>
              <Select
                options={[
                  { value: 'easy', label: 'سهل' },
                  { value: 'medium', label: 'متوسط' },
                  { value: 'hard', label: 'صعب' },
                ]}
                value={formData.difficulty}
                onChange={(val) => setFormData({ ...formData, difficulty: val })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-light/60 mb-2 mr-1">نص السؤال</label>
            <Input
              placeholder="اكتب السؤال هنا..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="font-bold"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-light/60 mb-1 mr-1">
              {formData.type === 'true_false' ? 'حدد الإجابة الصحيحة' : 
               formData.type === 'ordering' ? 'عناصر الترتيب (بالترتيب الصحيح)' :
               formData.type === 'matching' ? 'أزواج التوصيل' :
               'الخيارات (حدد الإجابة الصحيحة)'}
            </label>

            {(formData.type === 'mcq' || formData.type === 'true_false') && (
              <div className="grid grid-cols-1 gap-3">
                {formData.options.map((option: string, index: number) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                      formData.correct_answer === option && option !== ''
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correct_answer: option })}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.correct_answer === option && option !== ''
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-white/20 hover:border-emerald-500'
                      }`}
                    >
                      {formData.correct_answer === option && option !== '' && <Icon name="check" className="text-white text-[10px]" />}
                    </button>
                    <Input
                      placeholder={`الخيار ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      readOnly={formData.type === 'true_false'}
                      className="bg-transparent border-none !h-auto !py-0 shadow-none focus:ring-0"
                    />
                  </div>
                ))}
              </div>
            )}

            {formData.type === 'ordering' && (
              <div className="space-y-3">
                {formData.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </div>
                    <Input
                      placeholder={`العنصر ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOrderingChange(index, e.target.value)}
                      className="bg-transparent border-none !h-auto !py-0 shadow-none focus:ring-0"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = formData.options.filter((_: any, i: number) => i !== index);
                          setFormData({ 
                            ...formData, 
                            options: newOptions,
                            correct_answer: newOptions.join('|||')
                          });
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                  className="w-full h-12 border-dashed border-2 border-white/10 rounded-2xl text-gray-light/40 hover:text-white hover:bg-white/5"
                >
                  <Icon name="plus" className="ml-2" />
                  إضافة عنصر جديد
                </Button>
              </div>
            )}

            {formData.type === 'matching' && (
              <div className="space-y-3">
                {formData.options.map((pair: {a: string, b: string}, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                      <Input
                        placeholder="العنصر أ"
                        value={pair.a}
                        onChange={(e) => handleMatchingChange(index, 'a', e.target.value)}
                        className="bg-transparent border-none !h-auto !py-0 shadow-none focus:ring-0 text-center"
                      />
                      <div className="relative flex items-center justify-center">
                        <div className="absolute left-[-1.5px] h-4 w-[1px] bg-white/10"></div>
                        <Input
                          placeholder="العنصر ب"
                          value={pair.b}
                          onChange={(e) => handleMatchingChange(index, 'b', e.target.value)}
                          className="bg-transparent border-none !h-auto !py-0 shadow-none focus:ring-0 text-center"
                        />
                      </div>
                    </div>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = formData.options.filter((_: any, i: number) => i !== index);
                          setFormData({ 
                            ...formData, 
                            options: newOptions,
                            correct_answer: newOptions.map((p: any) => `${p.a}===${p.b}`).join('|||')
                          });
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFormData({ ...formData, options: [...formData.options, { a: '', b: '' }] })}
                  className="w-full h-12 border-dashed border-2 border-white/10 rounded-2xl text-gray-light/40 hover:text-white hover:bg-white/5"
                >
                  <Icon name="plus" className="ml-2" />
                  إضافة زوج جديد
                </Button>
              </div>
            )}
          </div>
        </form>

        <div className="p-6 bg-black/20 border-t border-white/5 flex gap-3">
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1 h-14 rounded-2xl font-black shadow-lg shadow-primary/20"
            isLoading={isSubmitting}
          >
            {question ? 'حفظ التعديلات' : 'إضافة السؤال للبنك'}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 h-14 rounded-2xl font-bold text-gray-light hover:bg-white/5"
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
};
