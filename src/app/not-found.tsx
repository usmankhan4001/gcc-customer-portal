'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-card card card-sand">
        <div className="icon-wrap">
          <Building2 className="w-10 h-10 text-orange" />
        </div>
        <span className="badge badge-navy">404 • PAGE NOT FOUND</span>
        <h1 className="title display-font text-navy">Requested Page Not Found</h1>
        <p className="desc text-secondary">
          The corporate filing page or tool URL you requested does not exist or has been moved.
        </p>

        <Link href="/" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>

      <style jsx>{`
        .not-found-container {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .not-found-card {
          max-width: 480px;
          width: 100%;
          padding: 40px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--orange-lt);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .desc {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
