import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useBookmarkStore } from '../../store/bookmarkStore';


export const Settings = () => {
  const { syncToServer } = useBookmarkStore();
  
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

    // 선택된 것이 없어도 전체를 보낼지 여부는 정책에 따라 다름.
    // 현재 Store 구현은 전체를 보냄. (선택 로직 무시)
    // if (selectedIds.size === 0) { ... } 

    setIsImporting(true);
    setMessage('Notebook으로 전송 중...');

    try {
      await syncToServer();
      
      // 스토어의 에러 상태 확인
      const currentError = useBookmarkStore.getState().error;
      if (currentError) {
        setMessage(`실패: ${currentError}`);
      } else {
        setMessage('성공적으로 전송했습니다!');
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
