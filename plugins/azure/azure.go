package azure

import (
	"github.com/kobsio/kobs/pkg/api/plugins/plugin"
	"github.com/kobsio/kobs/pkg/log"
	"github.com/kobsio/kobs/plugins/azure/pkg/instance"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// Route is the route under which the plugin should be registered in our router for the rest api.
const (
	Route = "/azure"
)

// Config is the structure of the configuration for the Azure plugin.
type Config []instance.Config

// Router implements the router for the Azure plugin, which can be registered in the router for our rest api.
type Router struct {
	*chi.Mux
	instances []instance.Instance
}

func (router *Router) getInstance(name string) instance.Instance {
	for _, i := range router.instances {
		if i.GetName() == name {
			return i
		}
	}

	return nil
}

// Register returns a new router which can be used in the router for the kobs rest api.
func Register(plugins *plugin.Plugins, config Config) chi.Router {
	var instances []instance.Instance

	for _, cfg := range config {
		inst, err := instance.New(cfg)
		if err != nil {
			log.Fatal(nil, "Could not create Azure instance.", zap.Error(err), zap.String("name", cfg.Name))
		}

		instances = append(instances, inst)

		plugins.Append(plugin.Plugin{
			Name:        cfg.Name,
			DisplayName: cfg.DisplayName,
			Description: cfg.Description,
			Type:        "azure",
		})
	}

	router := Router{
		chi.NewRouter(),
		instances,
	}

	router.Route("/{name}", func(r chi.Router) {
		r.Get("/resourcegroups", router.getResourceGroups)

		r.Route("/containerinstances", func(containerInstancesRouter chi.Router) {
			containerInstancesRouter.Get("/containergroups", router.getContainerGroups)
			containerInstancesRouter.Get("/containergroup/details", router.getContainerGroup)
			containerInstancesRouter.Get("/containergroup/logs", router.getContainerLogs)
			containerInstancesRouter.Put("/containergroup/restart", router.restartContainerGroup)
		})

		r.Route("/costmanagement", func(costManagementRouter chi.Router) {
			costManagementRouter.Get("/actualcosts", router.getActualCosts)
		})

		r.Route("/kubernetesservices", func(kubernetesServicesRouter chi.Router) {
			kubernetesServicesRouter.Get("/managedclusters", router.getManagedClusters)
			kubernetesServicesRouter.Get("/managedcluster/details", router.getManagedCluster)
			kubernetesServicesRouter.Get("/managedcluster/nodepools", router.getNodePools)
		})

		r.Route("/virtualmachinescalesets", func(virtualMachineScaleSetsRouter chi.Router) {
			virtualMachineScaleSetsRouter.Get("/virtualmachinescalesets", router.getVirtualMachineScaleSets)
			virtualMachineScaleSetsRouter.Get("/virtualmachinescaleset/details", router.getVirtualMachineScaleSetDetails)
			virtualMachineScaleSetsRouter.Get("/virtualmachines", router.getVirtualMachines)
		})

		r.Route("/monitor", func(monitorRouter chi.Router) {
			monitorRouter.Get("/metrics", router.getMetrics)
		})
	})

	return router
}
