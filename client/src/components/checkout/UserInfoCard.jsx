import ProfileDialog from '@/components/user/Profile';
import { User } from 'lucide-react';

const UserInfoCard = ({ userData, onUserUpdated, formattedUserData }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <User size={18} className="text-primary" />
        Seus dados
      </h2>
      <ProfileDialog
        onUserUpdated={onUserUpdated}
        userData={formattedUserData}
      />
    </div>

    <div className="grid grid-cols-1 gap-4">
      <div className="bg-gray-50 p-2 rounded-md">
        <p className="text-xs text-gray-500 mb-1">Nome completo</p>
        <p className="font-medium">{userData?.name || 'Não disponível'}</p>
      </div>
      <div className="bg-gray-50 p-2 rounded-md">
        <p className="text-xs text-gray-500 mb-1">E-mail</p>
        <p className="font-medium">{userData?.email || 'Não disponível'}</p>
      </div>
      <div className="bg-gray-50 p-2 rounded-md flex items-start">
        <div className="flex-grow">
          <p className="text-xs text-gray-500 mb-1">Telefone</p>
          <p className="font-medium">{userData?.phone || '-'}</p>
        </div>
      </div>
    </div>
  </div>
);

export default UserInfoCard;
