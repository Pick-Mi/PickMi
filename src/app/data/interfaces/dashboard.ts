export interface DashboardResumen {
  totalVistas: number;
  totalFavoritos: number;
  promedioGlobal: number;
  totalComentariosGlobal: number;
  calificacionesDistribucion: { calificacion: number; total: number }[];
  calificacionesPorComercio: { comercio: string; promedio: number; totalComentarios: number }[];
  vistasPorComercio: { comercio: string; total: number }[];
  favoritosPorComercio: { comercio: string; total: number }[];
}
