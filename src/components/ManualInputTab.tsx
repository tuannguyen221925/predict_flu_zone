import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { usePredictZone, ManualPredictionData } from '../queries/usePredictions';

export const ManualInputTab: React.FC = () => {
  const { selectedZone } = useStore();
  const { mutate: predictZone, isPending, error, isSuccess } = usePredictZone();

  const [formData, setFormData] = useState<ManualPredictionData>({
    zone_name: selectedZone,
    avg_temp_max: 32,
    avg_temp_med: 28,
    sum_precip_tot: 100,
    avg_humid: 80,
    dengue_trends: 50,
    symptoms_trends: 20,
    lag1: 10,
    lag2: 15,
    lag3: 12,
    ma4: 12.5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ManualPredictionData, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.zone_name.trim()) newErrors.zone_name = 'Vui lòng chọn khu vực';
    if (formData.avg_temp_max < -10 || formData.avg_temp_max > 50)
      newErrors.avg_temp_max = 'Nhiệt độ tối đa phải từ -10 đến 50°C';
    if (formData.avg_temp_med < -10 || formData.avg_temp_med > 50)
      newErrors.avg_temp_med = 'Nhiệt độ trung bình phải từ -10 đến 50°C';
    if (formData.sum_precip_tot < 0 || formData.sum_precip_tot > 1000)
      newErrors.sum_precip_tot = 'Lượng mưa phải từ 0 đến 1000mm';
    if (formData.avg_humid < 0 || formData.avg_humid > 100)
      newErrors.avg_humid = 'Độ ẩm phải từ 0 đến 100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      predictZone(formData);
    }
  };

  const formGroups = [
    {
      title: 'Dữ liệu thời tiết',
      fields: [
        { key: 'avg_temp_max' as const, label: 'Nhiệt độ tối đa (°C)', min: -10, max: 50, step: 0.1 },
        { key: 'avg_temp_med' as const, label: 'Nhiệt độ trung bình (°C)', min: -10, max: 50, step: 0.1 },
        { key: 'sum_precip_tot' as const, label: 'Lượng mưa tổng (mm)', min: 0, max: 1000, step: 0.1 },
        { key: 'avg_humid' as const, label: 'Độ ẩm trung bình (%)', min: 0, max: 100, step: 0.1 },
      ],
    },
    {
      title: 'Xu hướng & Trends',
      fields: [
        { key: 'dengue_trends' as const, label: 'Xu hướng Sốt xuất huyết', min: 0, max: 100, step: 1 },
        { key: 'symptoms_trends' as const, label: 'Xu hướng Triệu chứng', min: 0, max: 100, step: 1 },
      ],
    },
    {
      title: 'Dữ liệu lịch sử (Lag)',
      fields: [
        { key: 'lag1' as const, label: 'Lag 1 (Quá khứ 1)', min: 0, max: 500, step: 0.1 },
        { key: 'lag2' as const, label: 'Lag 2 (Quá khứ 2)', min: 0, max: 500, step: 0.1 },
        { key: 'lag3' as const, label: 'Lag 3 (Quá khứ 3)', min: 0, max: 500, step: 0.1 },
        { key: 'ma4' as const, label: 'MA4 (Trung bình động 4)', min: 0, max: 500, step: 0.1 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Dự báo Thủ công</h2>
        <p className="text-text-secondary">
          Nhập dữ liệu chi tiết để thực hiện dự báo cho khu vực <strong>{selectedZone}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {formGroups.map((group) => (
          <div key={group.title} className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{group.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={`w-full px-4 py-2 border rounded-lg font-mono text-sm transition-colors ${
                      errors[field.key]
                        ? 'border-danger bg-red-50 text-red-900'
                        : 'border-gray-300 bg-white text-text-primary hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {errors[field.key] && (
                    <p className="text-xs text-danger mt-1">{errors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Zone Info */}
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-text-primary">
            <strong>Khu vực:</strong> {selectedZone}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex gap-4">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-danger mb-1">Lỗi dự báo</h4>
                <p className="text-sm text-red-700">
                  {error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="card bg-green-50 border-green-200">
            <div className="flex gap-4">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success mb-1">Thành công!</h4>
                <p className="text-sm text-green-700">
                  Dự báo đã được lưu thành công
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl'
            }`}
          >
            {isPending ? 'Đang xử lý...' : 'Dự báo'}
          </button>
          <button
            type="reset"
            className="px-6 py-3 bg-gray-200 text-text-primary rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            onClick={() => setErrors({})}
          >
            Đặt lại
          </button>
        </div>
      </form>
    </div>
  );
};
