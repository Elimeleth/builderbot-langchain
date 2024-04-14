class Manager {
    private static instance: Manager;
    private instances: Map<string, any>;

    private constructor() {
        this.instances = new Map<string, any>();
    }

    public static hub(): Manager {
        if (!Manager.instance) {
            Manager.instance = new Manager();
        }
        return Manager.instance;
    }

    /**
     * Manager.hub().add('name', classeInstance)
     * @param name 
     * @param instance 
     */
    public add(name: string, instance: any): void {
        this.instances.set(name, instance);
    }

    /**
     * Recupera el instanciamiento de una clase 
     * Manager.hub().get('name')
     * @param nombre 
     * @returns 
     */
    public get<T = any>(nombre: string): T {
        return this.instances.get(nombre);
    }
}
export { Manager }