import { Injectable } from '@angular/core';

/**
 * Platform Detection Service
 * Automatically detects if running on Netlify or Vercel and returns correct proxy paths
 */

export type DeploymentPlatform = 'netlify' | 'vercel' | 'local' | 'unknown';

@Injectable({
  providedIn: 'root'
})
export class PlatformDetectionService {
  
  private platform: DeploymentPlatform = 'unknown';
  
  constructor() {
    this.detectPlatform();
  }
  
  /**
   * Detect the current deployment platform
   */
  private detectPlatform(): void {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.platform = 'local';
      console.log('🏠 Platform: Local Development');
      return;
    }
    
    // Vercel detection (*.vercel.app or custom domain on Vercel)
    if (hostname.includes('vercel.app') || this.isVercelCustomDomain()) {
      this.platform = 'vercel';
      console.log('▲ Platform: Vercel');
      return;
    }
    
    // Netlify detection (*.netlify.app or custom domain on Netlify)
    if (hostname.includes('netlify.app') || this.isNetlifyCustomDomain()) {
      this.platform = 'netlify';
      console.log('◆ Platform: Netlify');
      return;
    }
    
    // Default to Netlify (if unknown)
    this.platform = 'netlify';
    console.warn('⚠️ Platform: Unknown - Defaulting to Netlify');
  }
  
  /**
   * Check if running on Vercel custom domain
   * Vercel sets window.__VERCEL__ or other indicators
   */
  private isVercelCustomDomain(): boolean {
    // Check for Vercel-specific indicators
    // Vercel injects __NEXT_DATA__ or __VERCEL__ in some cases
    return !!(window as any).__VERCEL__ || 
           !!(window as any).__NEXT_DATA__;
  }
  
  /**
   * Check if running on Netlify custom domain
   * Can check for Netlify-specific headers or scripts
   */
  private isNetlifyCustomDomain(): boolean {
    // Check for Netlify-specific indicators
    // Netlify often injects scripts with "netlify" in the URL
    const scripts = Array.from(document.scripts);
    return scripts.some(script => script.src.includes('netlify'));
  }
  
  /**
   * Get current platform
   */
  getPlatform(): DeploymentPlatform {
    return this.platform;
  }
  
  /**
   * Get OpenAI Proxy URL based on platform
   */
  getOpenAIProxyUrl(): string {
    switch (this.platform) {
      case 'netlify':
        return '/.netlify/functions/openai-proxy';
      case 'vercel':
        return '/api/openai-proxy';
      case 'local':
        return 'http://localhost:3001/llm';
      default:
        // Default to Netlify
        return '/.netlify/functions/openai-proxy';
    }
  }
  
  /**
   * Get Geocoding Proxy URL based on platform
   */
  getGeocodingProxyUrl(): string {
    switch (this.platform) {
      case 'netlify':
        return '/.netlify/functions/geocode-proxy';
      case 'vercel':
        return '/api/geocode-proxy';
      case 'local':
        return 'http://localhost:3001/geocoding';
      default:
        return '/.netlify/functions/geocode-proxy';
    }
  }
  
  /**
   * Get Repository Proxy URL based on platform
   */
  getRepositoryProxyUrl(): string {
    switch (this.platform) {
      case 'netlify':
        return '/.netlify/functions/repository-proxy';
      case 'vercel':
        return '/api/repository-proxy';
      case 'local':
        return 'http://localhost:3001/repository';
      default:
        return '/.netlify/functions/repository-proxy';
    }
  }
  
  /**
   * Check if running on Netlify
   */
  isNetlify(): boolean {
    return this.platform === 'netlify';
  }
  
  /**
   * Check if running on Vercel
   */
  isVercel(): boolean {
    return this.platform === 'vercel';
  }
  
  /**
   * Check if running locally
   */
  isLocal(): boolean {
    return this.platform === 'local';
  }
  
  /**
   * Get platform display name
   */
  getPlatformName(): string {
    switch (this.platform) {
      case 'netlify':
        return 'Netlify';
      case 'vercel':
        return 'Vercel';
      case 'local':
        return 'Local Development';
      default:
        return 'Unknown Platform';
    }
  }
}
