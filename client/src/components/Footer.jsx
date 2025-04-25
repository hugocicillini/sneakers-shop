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
    <footer className="bg-slate-800 text-slate-200">
      {/* Newsletter section */}
      <div className="border-b border-slate-800">
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-2">
                Fique por dentro das novidades
              </h3>
              <p className="text-slate-400">
                Assine nossa newsletter e receba ofertas exclusivas, lançamentos
                e dicas de estilo.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Seu melhor e-mail"
                className="bg-slate-800 border-slate-700 text-slate-200 min-w-[250px]"
              />
              <Button className="bg-primary hover:bg-primary/90">
                Assinar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - About */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">SneakerShop</h2>
            </div>
            <p className="text-slate-400 mb-6">
              Somos apaixonados por sneakers e nos dedicamos a trazer os
              melhores e mais exclusivos modelos para nossos clientes, com
              conforto, estilo e autenticidade.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Facebook"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                aria-label="Youtube"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Todos os Tênis
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">
              Categorias
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/sneakers?brand=Nike"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Nike
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?brand=Adidas"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Adidas
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?gender=masculino"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Masculino
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?gender=feminino"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Feminino
                </Link>
              </li>
              <li>
                <Link
                  to="/sneakers?tags=corrida"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Corrida
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-white mr-2 mt-0.5" />
                <span className="text-slate-400">
                  Av. Paulista, 1000 - São Paulo, SP
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-white mr-2" />
                <span className="text-slate-400">(11) 99999-9999</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-white mr-2" />
                <span className="text-slate-400">contato@sneakershop.com</span>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-slate-400 text-sm">
                Horário de atendimento:
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
      <div className="border-t border-slate-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © {currentYear} SneakerShop. Todos os direitos reservados.
            </p>

            <div className="flex flex-col sm:flex-row items-center flex-wrap gap-4 mt-4 md:mt-0">
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  to="/privacy"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  to="/terms"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Termos de Uso
                </Link>
                <Link
                  to="/returns"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Política de Trocas
                </Link>
              </div>

              <div className="flex items-center bg-slate-800/50 px-3 py-2 rounded-md border border-slate-700">
                <span className="text-slate-300 text-sm font-medium mr-3">
                  Pagamentos:
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src="https://img.icons8.com/color/48/000000/visa.png"
                    alt="Visa"
                    className="h-7 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/mastercard.png"
                    alt="Mastercard"
                    className="h-7 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/paypal.png"
                    alt="PayPal"
                    className="h-7 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/boleto-bankario.png"
                    alt="Boleto Bancário"
                    className="h-7 w-auto"
                  />
                  <img
                    src="https://img.icons8.com/color/48/000000/pix.png"
                    alt="PIX"
                    className="h-6 w-auto"
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
