import TenisList from './TenisList';

const Tenis = ({ tenis, fetchTenis }) => {
  return (
    <div>
      <div className='mt-8 ml-8 flex flex-col justify-center items-center'>
        <h2>{tenis.length} produtos encontrados!</h2>
      </div>
      <TenisList tenis={tenis} fetchTenis={fetchTenis} />
    </div>
  );
};

export default Tenis;
