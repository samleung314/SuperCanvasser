"""Vehicle Routing Problem"""
from __future__ import print_function
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2
import sys
import json

###########################
# Problem Data Definition #
###########################

def create_data():
  """Stores the data for the problem"""
  # Locations
  num_vehicles = int(sys.argv[1])
  depot = 0
  locations = [(0,0)] #first node is depot: ignored for arbitrary start
  c = sys.argv[2]
  coords = json.loads(c)
  for pair in coords:
	  locations.append([float(pair.get('lat')), float(pair.get('lng'))]) #convert json into array of coords ###################
  num_locations = len(locations)
  dist_matrix = {}

  for from_node in range(num_locations):
    dist_matrix[from_node] = {}

    for to_node in range(num_locations):
      if from_node == depot or to_node == depot:
          # Depot is ignored (arbitrary start -> beginning of each task)
          dist_matrix[from_node][to_node] = 0
      else:
          dist_matrix[from_node][to_node] = (
            manhattan_distance(locations[from_node], locations[to_node]))
  return [num_vehicles, depot, locations, dist_matrix]

###################################
# Distance callback and dimension #
###################################

def manhattan_distance(position_1, position_2):
  """Approximate manhattan distance in meters between two points"""
  return ((abs(position_1[0] - position_2[0]) * 111030) + (abs(position_1[1] - position_2[1])* 85390)) 

def CreateDistanceCallback(dist_matrix):

  def dist_callback(from_node, to_node):
    #convert manhattan dist to minutes by dividing by meters/minute and adding visit duration
    return (((dist_matrix[from_node][to_node])/(float(sys.argv[3]) * 60)) + float(sys.argv[4])) 

  return dist_callback

def add_distance_dimension(routing, dist_callback):
  """Add Global Span constraint"""
  distance = "Distance"
  maximum_distance = 999999
  routing.AddDimension(
    dist_callback,
    0, # null slack
    maximum_distance, # maximum distance per vehicle
    True, # start cumul to zero
    distance)
  distance_dimension = routing.GetDimensionOrDie(distance)
  # Try to minimize the max distance among vehicles.
  distance_dimension.SetGlobalSpanCostCoefficient(100)

################
# Print Routes #
################

def print_routes(num_vehicles, locations, routing, assignment):
  """Prints assignment on console"""
  total_dist = 0
  final = '['
  for vehicle_id in range(num_vehicles):
    index = routing.Start(vehicle_id)
    # Skip depot - vehicles starting at arbitray locations.
    node = routing.IndexToNode(index)
    next_node = routing.IndexToNode(
      assignment.Value(routing.NextVar(index)))
    index = routing.NodeToIndex(next_node)
    node = routing.IndexToNode(index)
    next_node = routing.IndexToNode(
      assignment.Value(routing.NextVar(index)))
    plan_output = '['
    route_dist = 0

    while not routing.IsEnd(index):
      node = routing.IndexToNode(index)
      next_node = routing.IndexToNode(
        assignment.Value(routing.NextVar(index)))

      index = assignment.Value(routing.NextVar(index))

      if routing.IsEnd(index):
        plan_output += '{node}],'.format(
          node=node)
      else:
        plan_output += '{node},'.format(
          node=node)
    final += plan_output
  final = final[:len(final) - 1] + ']'
  print(final)
  sys.stdout.flush()

########
# Main #
########

def main():
  """Entry point of the program"""
  # Instantiate the data problem.
  [num_vehicles, depot, locations, dist_matrix] = create_data()
  num_locations = len(locations)
  # Create Routing Model
  routing = pywrapcp.RoutingModel(num_locations, num_vehicles, depot)
  # Define weight of each edge
  dist_callback = CreateDistanceCallback(dist_matrix)
  routing.SetArcCostEvaluatorOfAllVehicles(dist_callback)
  add_distance_dimension(routing, dist_callback)
  # Setting first solution heuristic (cheapest addition).
  search_parameters = pywrapcp.RoutingModel.DefaultSearchParameters()
  search_parameters.first_solution_strategy = (
    routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
  # Solve the problem.
  assignment = routing.SolveWithParameters(search_parameters)
  print_routes(num_vehicles, locations, routing, assignment)

if __name__ == '__main__':
  main()