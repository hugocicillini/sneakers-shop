import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f7f7f7] border-t border-gray-200">
      {/* Newsletter section */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto py-12 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Fique por dentro das novidades
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Assine nossa newsletter e receba ofertas exclusivas, lançamentos
                e dicas de estilo direto no seu e-mail.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Seu melhor e-mail"
                className="bg-white border-gray-300 text-gray-900 focus:border-gray-500 min-w-[280px] h-12"
              />
              <Button className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-6 rounded-md transition-colors">
                Assinar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1 - About */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">SneakerShop</h2>
              <div className="w-12 h-1 bg-red-500 mt-2 rounded-full"></div>
            </div>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Somos apaixonados por sneakers e nos dedicamos a trazer os
              melhores e mais exclusivos modelos para nossos clientes, com
              conforto, estilo e autenticidade.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Facebook"
                className="w-10 h-10 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-10 h-10 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                aria-label="Youtube"
                className="w-10 h-10 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-gray-900 relative">
              Links Rápidos
              <div className="w-8 h-0.5 bg-red-500 mt-2 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Todos os Tênis
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-gray-900 relative">
              Categorias
              <div className="w-8 h-0.5 bg-red-500 mt-2 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/sneakers?brand=Nike"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Nike
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?brand=Adidas"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Adidas
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?gender=masculino"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Masculino
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?gender=feminino"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Feminino
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?tags=corrida"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm font-medium"
                >
                  Corrida
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-gray-900 relative">
              Contato
              <div className="w-8 h-0.5 bg-red-500 mt-2 rounded-full"></div>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <MapPin className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm leading-relaxed">
                  Av. Paulista, 1000 - São Paulo, SP
                </span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Phone className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm">(11) 99999-9999</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm">
                  contato@sneakershop.com
                </span>
              </li>
            </ul>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm leading-relaxed">
                <span className="font-semibold text-gray-900">
                  Horário de atendimento:
                </span>
                <br />
                Segunda a Sexta: 9h às 18h
                <br />
                Sábado: 10h às 15h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar with copyright and legal links */}
      <div className="border-t border-gray-100 bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-gray-600 text-sm">
              © {currentYear} SneakerShop. Todos os direitos reservados.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-wrap gap-6 text-sm">
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200"
                >
                  Política de Privacidade
                </Link>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200"
                >
                  Termos de Uso
                </Link>
                <Link
                  to="/returns"
                  className="text-gray-600 hover:text-red-500 transition-colors duration-200"
                >
                  Política de Trocas
                </Link>
              </div>

              <div className="flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-700 text-sm font-medium mr-4">
                  Pagamentos:
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src="https://img.icons8.com/color/48/000000/visa.png"
                    alt="Visa"
                    className="h-8 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/mastercard.png"
                    alt="Mastercard"
                    className="h-8 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/boleto-bankario.png"
                    alt="Boleto Bancário"
                    className="h-8 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/pix.png"
                    alt="PIX"
                    className="h-7 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
