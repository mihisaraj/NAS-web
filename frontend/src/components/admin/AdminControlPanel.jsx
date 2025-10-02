const AdminControlPanel = ({
  primary,
  secondary,
  tertiary,
}) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
    <div className="flex flex-col gap-6">{primary}</div>
    <div className="flex flex-col gap-6">{secondary}</div>
    {tertiary ? <div className="flex flex-col gap-6 xl:col-span-2">{tertiary}</div> : null}
  </div>
);

export default AdminControlPanel;
