"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkAuthStatus, testHeaderConstruction, forceLogin } from '@/utils/auth-check';
import { getHeaders } from '@/config/api';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const checkAuthState = () => {
    const status = checkAuthStatus();
    const authToken = sessionStorage.getItem('auth_token');
    
    // Test header construction
    let headerTest = null;
    if (authToken) {
      headerTest = getHeaders({ authToken });
    }
    
    const info = {
      ...status,
      headerTest,
      authTokenLength: authToken?.length || 0,
      sessionStorageSize: Object.keys(sessionStorage).length,
    };
    
    setDebugInfo(info);
    console.log('🔍 Auth Debug Info:', info);
  };
  
  const testHeaders = () => {
    testHeaderConstruction();
  };
  
  const redirectToLogin = () => {
    forceLogin();
  };

  const clearAuth = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    setDebugInfo(null);
    console.log('🧹 Auth data cleared');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>
          Debug authentication state and token storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={checkAuthState}>Check Auth State</Button>
          <Button onClick={testHeaders} variant="outline">Test Headers</Button>
          <Button onClick={redirectToLogin} variant="outline">Go to Login</Button>
          <Button onClick={clearAuth} variant="destructive">Clear Auth Data</Button>
        </div>
        
        {debugInfo && (
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
