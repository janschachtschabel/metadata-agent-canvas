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
  private platformConfirmed: boolean = false;
  
  constructor() {
    this.detectPlatform();
  }
  
  /**
   * Detect the current deployment platform
   */
  private detectPlatform(): void {
    const hostname = window.location.hostname;
    
    console.log('🔍 Detecting platform for hostname:', hostname);
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.platform = 'local';
      console.log('🏠 Platform: Local Development');
      return;
    }
    
    // Vercel detection - CHECK FIRST (more specific)
    // Check hostname first, then environment indicators
    if (hostname.includes('vercel.app')) {
      this.platform = 'vercel';
      console.log('▲ Platform: Vercel (detected via hostname)');
      return;
    }
    
    // Check for Vercel environment indicators
    if (this.isVercelCustomDomain()) {
      this.platform = 'vercel';
      console.log('▲ Platform: Vercel (detected via environment)');
      return;
    }
    
    // Netlify detection
    if (hostname.includes('netlify.app')) {
      this.platform = 'netlify';
      console.log('◆ Platform: Netlify (detected via hostname)');
      return;
    }
    
    if (this.isNetlifyCustomDomain()) {
      this.platform = 'netlify';
      console.log('◆ Platform: Netlify (detected via environment)');
      return;
    }
    
    // Default to unknown, but log warning
    this.platform = 'unknown';
    console.warn('⚠️ Platform: Unknown - Hostname:', hostname);
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
    // Runtime check: Try Vercel first if hostname contains vercel
    if (!this.platformConfirmed && window.location.hostname.includes('vercel')) {
      this.platform = 'vercel';
      this.platformConfirmed = true;
      console.log('🔄 Platform corrected to Vercel via runtime check');
    }
    
    switch (this.platform) {
      case 'netlify':
        return '/.netlify/functions/openai-proxy';
      case 'vercel':
        return '/api/openai-proxy';
      case 'local':
        return 'http://localhost:3001/llm';
      default:
        // Fallback: Try to detect from hostname
        if (window.location.hostname.includes('vercel')) {
          console.log('⚠️ Unknown platform, but hostname contains "vercel" - using Vercel API');
          return '/api/openai-proxy';
        }
        return '/.netlify/functions/openai-proxy';
    }
  }
  
  /**
   * Get Geocoding Proxy URL based on platform
   */
  getGeocodingProxyUrl(): string {
    switch (this.platform) {
      case 'netlify':
        return '/.netlify/functions/photon';
      case 'vercel':
        return '/api/geocode-proxy';
      case 'local':
        return 'http://localhost:3001/geocoding';
      default:
        if (window.location.hostname.includes('vercel')) {
          return '/api/geocode-proxy';
        }
        return '/.netlify/functions/photon';
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
        if (window.location.hostname.includes('vercel')) {
          return '/api/repository-proxy';
        }
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
