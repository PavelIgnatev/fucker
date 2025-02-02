import React from 'react';

interface LogsStatsProps {
  prefixId: string;
  accountId?: string;
}

export const LogsStats: React.FC<LogsStatsProps> = ({ prefixId, accountId }) => {
  return (
    <div style={{ 
      width: "40%", 
      borderRight: "1px solid #e8e8e8", 
      padding: "16px",
      backgroundColor: "#fafafa"
    }}>
      <h3>Статусы аккаунтов</h3>
      {/* Здесь будет реализована логика и отображение статусов */}
    </div>
  );
}; 