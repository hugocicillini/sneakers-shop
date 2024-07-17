import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardTitle } from "./ui/card";

const TenisList = ({ tenis, fetchTenis }) => {
  return (
    <>
      <div className='mt-8 ml-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2'>
        <Button variant="outline" onClick={() => fetchTenis("todos")}>Todos</Button>
        <Button variant="outline" onClick={() => fetchTenis("Nike")}>Nike</Button>
        <Button variant="outline" onClick={() => fetchTenis("Converse")}>Converse</Button>
        <Button variant="outline" onClick={() => fetchTenis("NewBalance")}>NewBalance</Button>
        <Button variant="outline" onClick={() => fetchTenis("Asics")}>Asics</Button>
      </div>
      <div className="p-8 flex flex-wrap justify-center items-center gap-10">
        {tenis.length > 0 ? (
          tenis.map((item) => (
            <Card key={item._id} className="flex flex-col items-center gap-2 pb-4">
              <img src={item.image} alt={item.name} className="w-[280px] max-w-[280px] h-[250px] rounded-t-xl " />
              <Badge onClick={() => fetchTenis(item.brand)} className={"cursor-pointer"}>{item.brand}</Badge>
              <CardTitle className="max-w-[90%] min-h-[30px] text-center">{item.name}</CardTitle>
              <span>R${item.price}</span>
              <Button variant="destructive">Comprar</Button>
            </Card>
          ))
        ) : (
          <p>Nenhum dado disponível</p>
        )}
      </div>
    </>
  );
};

export default TenisList;
