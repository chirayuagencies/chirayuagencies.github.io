import React from 'react';
import './Brands.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Autoplay } from 'swiper/modules';

// Import brand logos
import alkacitron from '../assets/brands/alkacitron.png';
import amrutanjan from '../assets/brands/amrutanjan.png';
import dollar from '../assets/brands/dollar.png';
import figaro from '../assets/brands/figaro.png';
import girnar from '../assets/brands/girnar.png';
import hamdard from '../assets/brands/hamdard.png';
import huggies from '../assets/brands/huggies.png';
import midas from '../assets/brands/midas.png';
import png from '../assets/brands/png.png';
import ttk from '../assets/brands/ttk.png';
import vicco from '../assets/brands/vicco.png';
import vini from '../assets/brands/vini.png';
import zandu from '../assets/brands/zandu.png';

const brands = [
  { name: 'Alkacitron', image: alkacitron, areas: 'MP', parties: 'Distributors, Chemists' },
  { name: 'Amrutanjan', image: amrutanjan, areas: 'MP', parties: 'Distributors, Chemists, PCD' },
  { name: 'Dollar Company', image: dollar, areas: 'MP', parties: 'Distributors' },
  { name: 'Deoleo', image: figaro, areas: 'Malwa', parties: 'Distributors, Supermarkets, Chemists' },
  { name: 'Hamdard', image: hamdard, areas: 'Indore', parties: 'Chemists, Ayurveda' },
  { name: 'Kimberly Clark', image: huggies, areas: 'Malwa Nimar', parties: 'Distributors' },
  { name: 'MidasCare', image: midas, areas: 'Indore', parties: 'Retailers' },
  { name: 'P&G Healthcare', image: png, areas: 'MP', parties: 'Chemists' },
  { name: 'TTK Healthcare', image: ttk, areas: 'Indore', parties: 'Retail, Pharma' },
  { name: 'Vicco', image: vicco, areas: 'MP', parties: 'Retailers, Wholesalers' },
  { name: 'Vini Cosmetics', image: vini, areas: 'MP', parties: 'Wholesalers, Sub Distributors, Retail Chains' },
  { name: 'Emami', image: zandu, areas: 'Indore', parties: 'Chemists, Ayurveda Stores' },
];


const Brands = () => {
  return (
    <section id="brands" className="min-h-screen py-12 px-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-6 text-center">Brands We Represent</h1>
      
      <div className="max-w-7xl mx-auto">
        <Swiper
          spaceBetween={24}
          breakpoints={{
            0: {
              slidesPerView: 1,
            },
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
            1280: {
              slidesPerView: 4,
            },
          }}
          loop={true}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          navigation={true}
          pagination={{ clickable: true }}
          modules={[Autoplay, Navigation]}
        >
          {brands.map((brand, index) => (
            <SwiperSlide key={index}>
              <div className="w-full max-w-xs mx-auto bg-white shadow-md rounded-lg p-4 flex flex-col items-center text-center">
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="h-16 w-auto object-contain mb-2"
                />
                <p className="text-sm font-semibold">{brand.name}</p>
                <p className="text-xs text-gray-600">{brand.areas}</p>
                <p className="text-xs text-gray-600">{brand.parties}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Brands;
