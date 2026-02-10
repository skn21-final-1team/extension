import { useState, useEffect } from 'react';
import { bookmarkService } from '../../services/bookmarkService';
import { apiService } from '../../services/apiService';

export const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');

  // API 키 변경 시 apiService에 반영 (메모리에만 보관, 팝업 닫으면 사라짐)
  useEffect(() => {
    apiService.setApiKey(apiKey);
  }, [apiKey]);

  const handleImport = async () => {
    if (!apiKey) {
      setMessage('API 키를 먼저 입력해주세요.');
      return;
    }

    setIsImporting(true);
    setMessage('Notebook으로 전송 중...');

    try {
      // 1. 전체 북마크 가져오기
      const allBookmarks = await bookmarkService.getAll();
      
      // 2. 백엔드로 전송
      const response = await apiService.syncBookmarks(allBookmarks);

      if (response.success && response.data) {
        setMessage(response.data.message || '성공적으로 전송했습니다!');
      } else {
        setMessage(`실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
       const msg = error instanceof Error ? error.message : '알 수 없는 오류';
       setMessage(`오류 발생: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="settings-panel">
      <h3>설정</h3>
      
      <div className="input-group">
        <label>Notebook API Key</label>
        <div className="input-row">
            <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API 키를 입력하세요"
            />
        </div>
      </div>

      <hr />

      <div className="action-group">
        <button 
          className="import-btn" 
          onClick={handleImport} 
          disabled={isImporting || !apiKey}
        >
          {isImporting ? '전송 중...' : 'Notebook으로 전송 (Send)'}
        </button>
        {message && <p className="status-message">{message}</p>}
      </div>

      <style>{`
        .settings-panel {
          padding: 6px 10px;
          background: #f9f9f9;
          border-bottom: 1px solid #eee;
          flex-shrink: 0;
        }
        .settings-panel h3 {
          font-size: 11px;
          margin-bottom: 4px;
        }
        .settings-panel hr {
          margin: 4px 0;
          border: none;
          border-top: 1px solid #eee;
        }
        .input-group {
          margin-bottom: 4px;
        }
        .input-group label {
          display: block;
          margin-bottom: 2px;
          font-weight: 500;
          font-size: 10px;
        }
        .input-row {
            display: flex;
            gap: 4px;
        }
        .input-row input {
            flex: 1;
            padding: 3px 6px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 11px;
        }
        .import-btn {
          width: 100%;
          padding: 4px 6px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        }
        .import-btn:disabled {
          background: #ccc;
        }
        .status-message {
          margin-top: 4px;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
