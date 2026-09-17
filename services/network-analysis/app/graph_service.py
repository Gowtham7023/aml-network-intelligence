import networkx as nx


def build_graph(transactions):

    graph = nx.DiGraph()

    for tx in transactions:
        source = tx["fromAccountId"]
        target = tx["toAccountId"]
        amount = tx["amount"]

        graph.add_node(source)
        graph.add_node(target)

        if graph.has_edge(source, target):
            graph[source][target]["totalAmount"] += amount
            graph[source][target]["transactions"] += 1
        else:
            graph.add_edge(
                source,
                target,
                totalAmount=amount,
                transactions=1
            )

    nodes = [
        {
            "id": node,
            "connections": graph.degree(node)
        }
        for node in graph.nodes
    ]

    edges = [
        {
            "source": source,
            "target": target,
            "amount": data["totalAmount"],
            "transactions": data["transactions"]
        }
        for source, target, data in graph.edges(data=True)
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "nodeCount": graph.number_of_nodes(),
        "edgeCount": graph.number_of_edges()
    }