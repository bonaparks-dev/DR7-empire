
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowLeftIcon, StarIcon, MapPinIcon, UsersIcon, BedIcon, BathIcon } from '../components/icons/Icons';
import { VILLAS } from '../constants';

export default function VillaListingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleVillaClick = (villaId: number) => {
    navigate(`/villas/villa-${villaId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Back Button */}
      <Button
        onClick={() => navigate("/")}
        className="fixed top-24 left-4 z-40 bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
        size="sm"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        {t("rentals.backto")}
      </Button>

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('villa.listings.title')}</h1>
            <p className="text-xl text-white/80">
              {t('villa.listings.subtitle')}
            </p>
          </div>

          {/* Villa Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {VILLAS.map((villa) => (
              <Card
                key={villa.id}
                className="bg-white/5 border-white/20 overflow-hidden cursor-pointer group hover:bg-white/10 transition-all duration-300"
                onClick={() => handleVillaClick(villa.id)}
              >
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={villa.images[0]}
                      alt={villa.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Distance Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white text-black font-medium">
                      {villa.distanceToBeach}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Rating & Location */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-sm">
                      <StarIcon className="w-4 h-4 fill-current text-white" />
                      <span className="font-medium">{villa.rating?.toFixed(1)}</span>
                      <span className="text-white/70">({villa.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-white/70">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{villa.location.split(',')[0]}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white/90 transition-colors">
                    {villa.title}
                  </h3>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-white/70">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{villa.maxGuests}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BedIcon className="w-4 h-4" />
                      <span>{villa.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BathIcon className="w-4 h-4" />
                      <span>{villa.bathrooms}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">
                    {typeof villa.description === 'string' ? villa.description : villa.description.it}
                  </p>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVillaClick(villa.id);
                      }}
                    >
                      {t('villa.listings.discoverMore')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-white/5 border border-white/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                {t('villa.listings.notFoundTitle')}
              </h2>
              <p className="text-white/80 mb-6">
                {t('villa.listings.notFoundDesc')}
              </p>
              <Button
                onClick={() => window.open("https://wa.me/393457905205", "_blank")}
                variant="luxury"
                size="lg"
              >
                {t('villa.listings.contactConcierge')}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
