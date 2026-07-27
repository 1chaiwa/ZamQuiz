.App {
  min-height: 100vh;
  background: #f8f9fa;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #FF6B00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile First Design */
@media (max-width: 768px) {
  .App {
    padding: 0;
  }
}

@media (min-width: 769px) {
  .App {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    min-height: 100vh;
  }
}
