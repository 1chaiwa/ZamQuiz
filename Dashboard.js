.quiztaking {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.qt-header {
  background: #FF6B00;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
}

.qt-header h1 {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  flex: 1;
}

.qt-header .back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.progress-container {
  padding: 20px;
  background: white;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #FF6B00;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.qt-content {
  flex: 1;
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

.question-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-size: 14px;
  font-weight: bold;
  color: #666;
}

.question-status {
  font-size: 12px;
  color: #999;
  font-weight: bold;
}

.question-status.answered {
  color: #00B894;
}

.question-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-button {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  text-align: left;
  font-size: 16px;
  color: #333;
}

.option-button.selected {
  border-color: #FF6B00;
  background: #FF6B0010;
}

.option-label {
  font-weight: bold;
  margin-right: 10px;
}

.option-text {
  flex: 1;
}

.check-mark {
  color: #FF6B00;
  font-weight: bold;
  font-size: 18px;
}

.qt-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qt-footer button {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary-inline {
  background: #FF6B00;
  color: white;
}

.btn-submit {
  background: #00B894;
  color: white;
}

.empty-state {
  text-align: center;
  margin-top: 60px;
  padding: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}
