.dashboard {
  min-height: 100vh;
  background: #f8f9fa;
}

.dashboard-header {
  background: linear-gradient(135deg, #FF6B00, #FF8C33);
  padding: 20px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  font-size: 24px;
  margin-bottom: 5px;
}

.header-content p {
  font-size: 14px;
  opacity: 0.9;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-number {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #FF6B00;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.subjects-section {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.subjects-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.subjects-section h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 5px;
}

.section-subtitle {
  color: #666;
}

.teacher-link-btn {
  background: white;
  border: 2px solid #FF6B00;
  color: #FF6B00;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.teacher-link-btn:hover {
  background: #FF6B0010;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.subject-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.subject-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.subject-icon {
  width: 50px;
  height: 50px;
  background: #FF6B0010;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-weight: bold;
  color: #FF6B00;
  font-size: 18px;
}

.subject-card h3 {
  font-size: 14px;
  color: #333;
  margin: 0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 15px;
  }

  .subjects-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-number {
    font-size: 22px;
  }
}
